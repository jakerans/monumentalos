import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    const [clients, leads, spend, paidBilling] = await Promise.all([
      sr.Client.list(),
      fetchAll(sr.Lead, '-created_date'),
      fetchAll(sr.Spend, '-date'),
      fetchAllFiltered(sr.MonthlyBilling, { status: 'paid' }, '-paid_date'),
    ]);

    // Build unified payments list from paid billing records
    const payments = paidBilling.map(b => ({
      id: b.id,
      client_id: b.client_id,
      amount: b.paid_amount || b.calculated_amount || 0,
      date: b.paid_date,
      method: b.payment_method || 'invoice',
      notes: `Invoice ${b.invoice_id || ''} (${b.billing_month})`,
      _source: 'billing',
    }));

    return Response.json({ clients, leads, spend, payments });
  } catch (error) {
    console.error('getClientPerformanceData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});