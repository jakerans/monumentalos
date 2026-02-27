import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 180);

    const leads = await sr.Lead.filter({ created_date: { $gte: cutoff.toISOString() } }, '-created_date', 3);
    
    return Response.json({
      leadCount: leads.length,
      sampleLeads: leads.map(l => ({
        id: l.id,
        client_id: l.client_id,
        created_date: l.created_date,
        lead_received_date: l.lead_received_date,
        name: l.name,
        keys: Object.keys(l),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});