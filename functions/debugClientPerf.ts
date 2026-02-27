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

    const cutoffStr = cutoff.toISOString();
    const leads1 = await sr.Lead.filter({ created_date: { $gte: cutoffStr } }, '-created_date', 3);
    const leads2 = await sr.Lead.filter({ created_date: { $gte: "2025-01-01" } }, '-created_date', 3);
    const allLeads = await sr.Lead.list('-created_date', 3);
    
    return Response.json({
      cutoffStr,
      filter1Count: leads1.length,
      filter2Count: leads2.length,
      listCount: allLeads.length,
      sampleList: allLeads.length > 0 ? { id: allLeads[0].id, created_date: allLeads[0].created_date } : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});