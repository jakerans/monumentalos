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

    const { client_id } = await req.json();
    if (!client_id) {
      return Response.json({ error: 'client_id is required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    const [clients, allLeads] = await Promise.all([
      sr.Client.filter({ id: client_id }),
      fetchAllFiltered(sr.Lead, { client_id }, '-created_date'),
    ]);

    const clientInfo = clients[0] || null;
    const isRetainer = clientInfo?.billing_type === 'retainer';

    // Filter to history leads based on billing type
    const historyLeads = allLeads.filter(lead => {
      if (isRetainer) {
        return lead.status === 'completed' || lead.status === 'disqualified' || lead.outcome === 'sold' || lead.outcome === 'lost';
      }
      if (lead.status !== 'appointment_booked' && lead.status !== 'completed') return false;
      return lead.appointment_date &&
        (lead.disposition === 'cancelled' ||
         lead.disposition === 'showed' ||
         (lead.outcome && lead.outcome !== 'pending'));
    });

    return Response.json({ clientInfo, leads: historyLeads });
  } catch (error) {
    console.error('getAppointmentHistoryData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});