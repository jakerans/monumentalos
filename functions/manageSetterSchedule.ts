import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const sr = base44.asServiceRole;

    if (action === 'bulk_create') {
      const { setter_id, shift_start, shift_end, days_of_week, start_date, end_date } = body;
      if (!setter_id || !shift_start || !shift_end || !days_of_week || !start_date || !end_date) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Get existing schedules for this setter in the date range
      const existing = await sr.entities.SetterSchedule.filter({ setter_id }, '-date', 500);
      const existingDates = new Set(existing.map(s => s.date));

      const daysSet = new Set(days_of_week);
      const toCreate = [];
      let skipped = 0;

      const current = new Date(start_date + 'T00:00:00');
      const endD = new Date(end_date + 'T00:00:00');

      while (current <= endD) {
        const dow = current.getDay();
        const dateStr = current.toISOString().split('T')[0];

        if (daysSet.has(dow)) {
          if (existingDates.has(dateStr)) {
            skipped++;
          } else {
            toCreate.push({
              setter_id,
              date: dateStr,
              shift_start,
              shift_end,
              status: 'scheduled',
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }

      if (toCreate.length > 0) {
        // bulkCreate in batches of 50
        for (let i = 0; i < toCreate.length; i += 50) {
          const batch = toCreate.slice(i, i + 50);
          await sr.entities.SetterSchedule.bulkCreate(batch);
        }
      }

      return Response.json({ success: true, created: toCreate.length, skipped });

    } else if (action === 'update') {
      const { schedule_id, shift_start, shift_end, status, notes } = body;
      if (!schedule_id) {
        return Response.json({ error: 'Missing schedule_id' }, { status: 400 });
      }
      const updates = {};
      if (shift_start !== undefined) updates.shift_start = shift_start;
      if (shift_end !== undefined) updates.shift_end = shift_end;
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;

      await sr.entities.SetterSchedule.update(schedule_id, updates);
      return Response.json({ success: true });

    } else if (action === 'delete') {
      const { schedule_id } = body;
      if (!schedule_id) {
        return Response.json({ error: 'Missing schedule_id' }, { status: 400 });
      }
      await sr.entities.SetterSchedule.delete(schedule_id);
      return Response.json({ success: true });

    } else if (action === 'get_team_schedule') {
      const { start_date, end_date } = body;
      if (!start_date || !end_date) {
        return Response.json({ error: 'Missing start_date or end_date' }, { status: 400 });
      }

      // Fetch all schedules (we'll filter by date range in code)
      const allSchedules = await sr.entities.SetterSchedule.filter({}, '-date', 2000);
      const schedules = allSchedules.filter(s => s.date >= start_date && s.date <= end_date);

      // Fetch setter users
      const allUsers = await sr.entities.User.filter({}, '-created_date', 500);
      const setters = allUsers
        .filter(u => u.app_role === 'setter')
        .map(u => ({ id: u.id, full_name: u.full_name || u.email }));

      return Response.json({ schedules, setters });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});