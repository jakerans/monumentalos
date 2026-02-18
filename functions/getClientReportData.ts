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

    const { client_id, start_date, end_date } = await req.json();
    if (!client_id) {
      return Response.json({ error: 'client_id is required' }, { status: 400 });
    }

    // Build date end with end-of-day for ISO comparisons
    const startISO = new Date(start_date + 'T00:00:00.000Z').toISOString();
    const endDate = new Date(end_date + 'T23:59:59.999Z');
    const endISO = endDate.toISOString();

    const sr = base44.asServiceRole.entities;

    const [clients, spendRecords, bookedLeads, appointmentLeads, soldLeads] = await Promise.all([
      sr.Client.filter({ id: client_id }),
      fetchAllFiltered(sr.Spend, { client_id, date: { $gte: start_date, $lte: end_date } }, '-date'),
      fetchAllFiltered(sr.Lead, { client_id, date_appointment_set: { $gte: startISO, $lte: endISO } }, '-created_date'),
      fetchAllFiltered(sr.Lead, { client_id, appointment_date: { $gte: startISO, $lte: endISO } }, '-created_date'),
      fetchAllFiltered(sr.Lead, { client_id, date_sold: { $gte: start_date, $lte: end_date } }, '-created_date'),
    ]);

    return Response.json({
      clientInfo: clients[0] || null,
      spendRecords,
      bookedLeads,
      appointmentLeads,
      soldLeads,
    });
  } catch (error) {
    console.error('getClientReportData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});