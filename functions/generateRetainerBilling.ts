// @schedule: 0 0 * * *
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Runs daily — checks if any retainer clients have their retainer_due_day matching today.
// If so, generates a billing record for the current month (if one doesn't already exist).

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
    if (user && user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    const now = new Date();
    const todayDay = now.getDate();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch retainer clients and existing billing records for this month
    const [clients, existingRecords] = await Promise.all([
      sr.Client.list(),
      fetchAllFiltered(sr.MonthlyBilling, { billing_month: currentMonthStr }, '-billing_month'),
    ]);

    const existingRetainerClientIds = new Set(
      existingRecords.filter(r => r.billing_type === 'retainer').map(r => r.client_id)
    );
    const existingHybridRetainerClientIds = new Set(
      existingRecords.filter(r => r.billing_type === 'hybrid_retainer').map(r => r.client_id)
    );

    // Find active retainer clients whose due day is today and don't already have a record
    const dueToday = clients.filter(c => {
      if (c.status !== 'active') return false;
      if ((c.billing_type || 'pay_per_show') !== 'retainer') return false;
      if (existingRetainerClientIds.has(c.id)) return false;
      const dueDay = c.retainer_due_day || 1;
      return dueDay === todayDay;
    });

    const records = dueToday.map(client => ({
      client_id: client.id,
      billing_month: currentMonthStr,
      billing_type: 'retainer',
      calculated_amount: client.retainer_amount || 0,
      manual_amount: client.retainer_amount || 0,
      quantity: 0,
      rate: client.retainer_amount || 0,
      status: 'pending',
    }));

    let created = 0;
    if (records.length > 0) {
      await sr.MonthlyBilling.bulkCreate(records);
      created = records.length;
    }

    // --- Hybrid retainer billing ---
    const hybridDueToday = clients.filter(c => {
      if (c.status !== 'active') return false;
      if (c.billing_type !== 'hybrid') return false;
      if (existingHybridRetainerClientIds.has(c.id)) return false;
      const dueDay = c.hybrid_retainer_due_day || 1;
      return dueDay === todayDay;
    });

    const hybridRecords = hybridDueToday.map(client => ({
      client_id: client.id,
      billing_month: currentMonthStr,
      billing_type: 'hybrid_retainer',
      calculated_amount: client.hybrid_base_retainer || 0,
      manual_amount: client.hybrid_base_retainer || 0,
      quantity: 0,
      rate: client.hybrid_base_retainer || 0,
      status: 'pending',
    }));

    let hybridCreated = 0;
    if (hybridRecords.length > 0) {
      await sr.MonthlyBilling.bulkCreate(hybridRecords);
      hybridCreated = hybridRecords.length;
    }

    console.log(`generateRetainerBilling: Day ${todayDay}, created ${created} retainer + ${hybridCreated} hybrid_retainer records for ${currentMonthStr}`);
    return Response.json({ success: true, currentMonth: currentMonthStr, todayDay, created, hybridCreated });
  } catch (error) {
    console.error('generateRetainerBilling error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});