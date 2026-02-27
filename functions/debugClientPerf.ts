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
    const allLeads = await sr.Lead.list('-created_date', 3);
    
    return Response.json({
      filterLeadCount: leads.length,
      listLeadCount: allLeads.length,
      sampleFilterLead: leads.length > 0 ? leads[0] : null,
      sampleListLead: allLeads.length > 0 ? { id: allLeads[0].id, client_id: allLeads[0].client_id, created_date: allLeads[0].created_date, lead_received_date: allLeads[0].lead_received_date, keys: Object.keys(allLeads[0]) } : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});