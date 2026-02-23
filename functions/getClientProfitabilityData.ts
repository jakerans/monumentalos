import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entity, filter = {}, sort = '-created_date') {
  const all = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    const batch = await entity.filter(filter, sort, limit, skip);
    all.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { start_date, end_date } = await req.json();
    if (!start_date || !end_date) {
      return Response.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    // Step 1 — Fetch everything in parallel
    const [clients, expenses, billings] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Client, { status: 'active' }),
      fetchAll(base44.asServiceRole.entities.Expense),
      fetchAll(base44.asServiceRole.entities.MonthlyBilling, { status: 'paid' }),
    ]);

    // Filter expenses and billings by date range
    const periodExpenses = expenses.filter(e => e.date >= start_date && e.date <= end_date);
    const periodBillings = billings.filter(b => b.paid_date && b.paid_date >= start_date && b.paid_date <= end_date);

    const activeClientCount = clients.length;

    // Step 2 — Shared costs (expenses with no client_id)
    const sharedExpenses = periodExpenses.filter(e => !e.client_id && e.expense_type !== 'distribution' && e.category !== 'distribution');
    let totalSharedCogs = 0;
    let totalSharedOverhead = 0;
    for (const e of sharedExpenses) {
      const amt = e.is_refunded ? 0 : ((e.amount || 0) - (e.refund_amount || 0));
      if (e.expense_type === 'cogs') totalSharedCogs += amt;
      else totalSharedOverhead += amt;
    }

    const perClientSharedCogs = activeClientCount > 0 ? totalSharedCogs / activeClientCount : 0;
    const perClientSharedOverhead = activeClientCount > 0 ? totalSharedOverhead / activeClientCount : 0;

    // Build lookup maps
    const expensesByClient = {};
    for (const e of periodExpenses) {
      if (e.client_id) {
        if (!expensesByClient[e.client_id]) expensesByClient[e.client_id] = [];
        expensesByClient[e.client_id].push(e);
      }
    }

    const billingsByClient = {};
    for (const b of periodBillings) {
      if (b.client_id) {
        if (!billingsByClient[b.client_id]) billingsByClient[b.client_id] = [];
        billingsByClient[b.client_id].push(b);
      }
    }

    // Step 3 — Per-client calculations
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalNetProfit = 0;
    let marginSum = 0;
    let marginCount = 0;

    const clientResults = clients.map(client => {
      const clientBillings = billingsByClient[client.id] || [];
      const revenue = clientBillings.reduce((sum, b) => {
        const amt = (b.paid_amount != null && b.paid_amount !== undefined) ? b.paid_amount : (b.calculated_amount || 0);
        return sum + amt;
      }, 0);

      const clientExpenses = expensesByClient[client.id] || [];
      const clientCosts = clientExpenses.reduce((sum, e) => {
        const amt = e.is_refunded ? 0 : ((e.amount || 0) - (e.refund_amount || 0));
        return sum + amt;
      }, 0);

      const sharedCogs = perClientSharedCogs;
      const sharedOverhead = perClientSharedOverhead;
      const editingCosts = 0;
      const costs = clientCosts + sharedCogs + sharedOverhead + editingCosts;
      const netProfit = revenue - costs;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : null;

      totalRevenue += revenue;
      totalCosts += costs;
      totalNetProfit += netProfit;
      if (margin !== null) {
        marginSum += margin;
        marginCount++;
      }

      return {
        client_id: client.id,
        client_name: client.name,
        billing_type: client.billing_type,
        revenue: Math.round(revenue * 100) / 100,
        clientCosts: Math.round(clientCosts * 100) / 100,
        sharedCogs: Math.round(sharedCogs * 100) / 100,
        sharedOverhead: Math.round(sharedOverhead * 100) / 100,
        editingCosts,
        totalCosts: Math.round(costs * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        margin: margin !== null ? Math.round(margin * 100) / 100 : null,
      };
    });

    // Step 4 — Return
    return Response.json({
      clients: clientResults,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCosts: Math.round(totalCosts * 100) / 100,
        totalNetProfit: Math.round(totalNetProfit * 100) / 100,
        avgMargin: marginCount > 0 ? Math.round((marginSum / marginCount) * 100) / 100 : null,
        activeClientCount,
      },
      period: { start_date, end_date },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});