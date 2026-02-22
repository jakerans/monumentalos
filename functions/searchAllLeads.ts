import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAllFiltered(entityRef, filter, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.filter(filter, sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const query = (body.query || '').trim().toLowerCase();

    if (query.length < 3) {
      return Response.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    const startTime = Date.now();

    const [allLeads, clients] = await Promise.all([
      fetchAllFiltered(sr.Lead, {}, '-created_date'),
      sr.Client.list(),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`searchAllLeads: fetched ${allLeads.length} leads in ${elapsed}ms, query="${query}"`);

    // Filter in memory: case-insensitive partial match on name, phone, email
    const matched = [];
    for (const lead of allLeads) {
      if (matched.length >= 25) break;
      const nameMatch = lead.name && lead.name.toLowerCase().includes(query);
      const phoneMatch = lead.phone && lead.phone.toLowerCase().includes(query);
      const emailMatch = lead.email && lead.email.toLowerCase().includes(query);
      if (nameMatch || phoneMatch || emailMatch) {
        matched.push({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          client_id: lead.client_id,
          status: lead.status,
          outcome: lead.outcome,
          created_date: lead.created_date,
          appointment_date: lead.appointment_date,
          date_appointment_set: lead.date_appointment_set,
          lead_received_date: lead.lead_received_date,
          disposition: lead.disposition,
          booked_by_setter_id: lead.booked_by_setter_id,
          setter_id: lead.setter_id,
        });
      }
    }

    return Response.json({
      results: matched,
      total_searched: allLeads.length,
      query: body.query,
      clients: clients.map(c => ({ id: c.id, name: c.name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});