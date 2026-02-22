import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, client_id, call_script, faqs, talking_points, general_notes } = await req.json();
    const sr = base44.asServiceRole.entities;

    if (action === 'get') {
      if (!client_id) return Response.json({ error: 'client_id required' }, { status: 400 });
      const records = await sr.ClientSOP.filter({ client_id }, '-created_date', 1);
      return Response.json({ sop: records[0] || null });
    }

    if (action === 'save') {
      const role = user.app_role || user.role;
      if (role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
      if (!client_id) return Response.json({ error: 'client_id required' }, { status: 400 });

      const existing = await sr.ClientSOP.filter({ client_id }, '-created_date', 1);
      const data = {
        client_id,
        call_script: call_script || '',
        faqs: faqs || '',
        talking_points: talking_points || '',
        general_notes: general_notes || '',
        last_updated: new Date().toISOString(),
      };

      if (existing.length > 0) {
        await sr.ClientSOP.update(existing[0].id, data);
        return Response.json({ success: true, sop: { ...existing[0], ...data } });
      } else {
        const created = await sr.ClientSOP.create(data);
        return Response.json({ success: true, sop: created });
      }
    }

    if (action === 'check_bulk') {
      // Returns a map of client_id -> has_sop for a list of client IDs
      const allSOPs = await sr.ClientSOP.list('-created_date', 5000);
      const sopMap = {};
      for (const sop of allSOPs) {
        const hasContent = !!(sop.call_script || sop.faqs || sop.talking_points || sop.general_notes);
        sopMap[sop.client_id] = hasContent;
      }
      return Response.json({ sop_map: sopMap });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('manageClientSOP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});