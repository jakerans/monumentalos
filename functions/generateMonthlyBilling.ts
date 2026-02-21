// @schedule: 0 2 1 * *
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Runs on the 1st of each month — generates billing records for pay_per_show and pay_per_set clients
// for the PRIOR month's activity.

async function fetchAll(entityRef, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.list(sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

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
    if (user && user.role !== 'admin' && user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    // Determine the prior month
    const now = new Date();
    const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const billingMonthStr = `${priorMonth.getFullYear()}-${String(priorMonth.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(priorMonth.getFullYear(), priorMonth.getMonth(), 1);
    const monthEnd = new Date(priorMonth.getFullYear(), priorMonth.getMonth() + 1, 0, 23, 59, 59);

    // Fetch clients, existing billing records, and leads in parallel
    const [clients, existingRecords, leads] = await Promise.all([
      sr.Client.list(),
      fetchAllFiltered(sr.MonthlyBilling, { billing_month: billingMonthStr }, '-billing_month'),
      fetchAllFiltered(sr.Lead, {
        $or: [
          { appointment_date: { $gte: monthStart.toISOString(), $lte: monthEnd.toISOString() } },
          { date_appointment_set: { $gte: monthStart.toISOString(), $lte: monthEnd.toISOString() } }
        ]
      }, '-created_date'),
    ]);

    const activeClients = clients.filter(c => c.status === 'active');
    const existingClientIds = new Set(existingRecords.map(r => r.client_id));

    // Only generate for pay_per_show and pay_per_set clients that don't already have a record
    const eligibleClients = activeClients.filter(c => {
      const bt = c.billing_type || 'pay_per_show';
      return (bt === 'pay_per_show' || bt === 'pay_per_set') && !existingClientIds.has(c.id);
    });

    const records = eligibleClients.map(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = leads.filter(l => l.client_id === client.id);
      const pricing = client.industry_pricing || [];

      let quantity = 0;
      let calculatedAmount = 0;

      if (bt === 'pay_per_show') {
        const showed = cLeads.filter(l =>
          l.disposition === 'showed' && l.appointment_date &&
          new Date(l.appointment_date) >= monthStart && new Date(l.appointment_date) <= monthEnd
        );
        quantity = showed.length;
        showed.forEach(lead => {
          const ind = (lead.industries && lead.industries[0]) || null;
          const match = ind ? pricing.find(p => p.industry === ind) : null;
          calculatedAmount += (match ? (match.price_per_show || 0) : (client.price_per_shown_appointment || 0));
        });
      } else if (bt === 'pay_per_set') {
        const booked = cLeads.filter(l =>
          l.date_appointment_set &&
          new Date(l.date_appointment_set) >= monthStart && new Date(l.date_appointment_set) <= monthEnd
        );
        quantity = booked.length;
        booked.forEach(lead => {
          const ind = (lead.industries && lead.industries[0]) || null;
          const match = ind ? pricing.find(p => p.industry === ind) : null;
          calculatedAmount += (match ? (match.price_per_set || 0) : (client.price_per_set_appointment || 0));
        });
      }

      const rate = quantity > 0 ? Math.round((calculatedAmount / quantity) * 100) / 100 : 0;

      return {
        client_id: client.id,
        billing_month: billingMonthStr,
        billing_type: bt,
        calculated_amount: calculatedAmount,
        quantity,
        rate,
        status: 'pending',
      };
    }).filter(r => r.quantity > 0);

    let created = 0;
    if (records.length > 0) {
      await sr.MonthlyBilling.bulkCreate(records);
      created = records.length;
    }

    // --- Hybrid performance billing ---
    const existingHybridPerfClientIds = new Set(
      existingRecords.filter(r => r.billing_type === 'hybrid_performance').map(r => r.client_id)
    );

    const hybridClients = activeClients.filter(c =>
      c.billing_type === 'hybrid' && !existingHybridPerfClientIds.has(c.id)
    );

    const hybridRecords = hybridClients.map(client => {
      const perfType = client.hybrid_performance_type || 'pay_per_set';
      const pricing = client.hybrid_performance_pricing || [];
      const cLeads = leads.filter(l => l.client_id === client.id);

      let quantity = 0;
      let calculatedAmount = 0;

      if (perfType === 'pay_per_show') {
        const showed = cLeads.filter(l =>
          l.disposition === 'showed' && l.appointment_date &&
          new Date(l.appointment_date) >= monthStart && new Date(l.appointment_date) <= monthEnd
        );
        quantity = showed.length;
        showed.forEach(lead => {
          const ind = (lead.industries && lead.industries[0]) || null;
          const match = ind ? pricing.find(p => p.industry === ind) : null;
          calculatedAmount += (match ? (match.price_per_show || 0) : 0);
        });
      } else if (perfType === 'pay_per_set') {
        const booked = cLeads.filter(l =>
          l.date_appointment_set &&
          new Date(l.date_appointment_set) >= monthStart && new Date(l.date_appointment_set) <= monthEnd
        );
        quantity = booked.length;
        booked.forEach(lead => {
          const ind = (lead.industries && lead.industries[0]) || null;
          const match = ind ? pricing.find(p => p.industry === ind) : null;
          calculatedAmount += (match ? (match.price_per_set || 0) : 0);
        });
      }

      const rate = quantity > 0 ? Math.round((calculatedAmount / quantity) * 100) / 100 : 0;

      return {
        client_id: client.id,
        billing_month: billingMonthStr,
        billing_type: 'hybrid_performance',
        calculated_amount: calculatedAmount,
        quantity,
        rate,
        status: 'pending',
      };
    }).filter(r => r.quantity > 0);

    let hybridCreated = 0;
    if (hybridRecords.length > 0) {
      await sr.MonthlyBilling.bulkCreate(hybridRecords);
      hybridCreated = hybridRecords.length;
    }

    console.log(`generateMonthlyBilling: Created ${created} performance + ${hybridCreated} hybrid_performance records for ${billingMonthStr}`);
    return Response.json({ success: true, billingMonth: billingMonthStr, created, hybridCreated });
  } catch (error) {
    console.error('generateMonthlyBilling error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});