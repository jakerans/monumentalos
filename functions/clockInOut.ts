import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appRole = user.app_role;
    if (appRole !== 'setter' && appRole !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await req.json();
    const setterId = user.id;
    const sr = base44.asServiceRole;
    const now = new Date();

    if (action === 'clock_in') {
      // Check for existing active entry
      const active = await sr.entities.TimeEntry.filter({ setter_id: setterId, status: 'active' }, '-created_date', 1);
      if (active.length > 0) {
        return Response.json({ error: 'Already clocked in', already_active: true }, { status: 400 });
      }

      const clockIn = now.toISOString();
      const dateStr = clockIn.split('T')[0];
      const entry = await sr.entities.TimeEntry.create({
        setter_id: setterId,
        clock_in: clockIn,
        status: 'active',
        date: dateStr,
      });

      return Response.json({ success: true, action: 'clock_in', entry_id: entry.id, clock_in: clockIn });

    } else if (action === 'clock_out') {
      // Find active entry
      const active = await sr.entities.TimeEntry.filter({ setter_id: setterId, status: 'active' }, '-created_date', 1);
      if (active.length === 0) {
        return Response.json({ error: 'Not clocked in', not_active: true }, { status: 400 });
      }

      const entry = active[0];
      const clockOut = now.toISOString();
      const diffMs = now.getTime() - new Date(entry.clock_in).getTime();
      const totalHours = Math.round((diffMs / 3600000) * 100) / 100;

      await sr.entities.TimeEntry.update(entry.id, {
        clock_out: clockOut,
        total_hours: totalHours,
        status: 'completed',
      });

      // Auto-finalize loot box transfers for covered shifts
      try {
        const entryDate = entry.date;
        const allPtoReqs = await sr.entities.PTORequest.filter({ transfer_status: 'pending_shift' }, '-created_date', 200);
        const matching = allPtoReqs.filter(r =>
          r.cover_setter_id === setterId &&
          r.request_date === entryDate &&
          r.status === 'approved'
        );
        for (const ptoReq of matching) {
          const boxIds = (ptoReq.offer_loot_box_ids || '').split(',').filter(Boolean);
          for (const boxId of boxIds) {
            await sr.entities.LootBox.update(boxId, { setter_id: setterId, hold_request_id: null });
          }
          await sr.entities.PTORequest.update(ptoReq.id, { transfer_status: 'completed' });
        }
      } catch (transferErr) {
        console.error('Auto-finalize transfer error (non-blocking):', transferErr.message);
      }

      return Response.json({ success: true, action: 'clock_out', entry_id: entry.id, total_hours: totalHours });

    } else {
      return Response.json({ error: 'Invalid action. Use "clock_in" or "clock_out".' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});