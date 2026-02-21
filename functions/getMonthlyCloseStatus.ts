import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.app_role !== 'admin' && user.app_role !== 'finance_admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { targetMonth } = await req.json();
    if (!targetMonth) {
      return Response.json({ error: 'targetMonth is required (YYYY-MM)' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;
    const [year, month] = targetMonth.split('-').map(Number);

    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    // Run all queries in parallel
    const [expByCat, expByType, allBilling, allClients, closedSettings] = await Promise.all([
      sr.Expense.filter({ category: 'uncategorized' }, '-date', 5000),
      sr.Expense.filter({ expense_type: 'uncategorized' }, '-date', 5000),
      sr.MonthlyBilling.filter({ billing_month: targetMonth }, '-billing_month', 1000),
      sr.Client.list(),
      sr.CompanySettings.filter({ key: 'closed_month' }, '-created_date', 200),
    ]);

    // Deduplicate uncategorized expenses and filter to target month
    const seen = new Set();
    let uncategorizedCount = 0;
    for (const e of [...expByCat, ...expByType]) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        if (e.date >= monthStart && e.date <= monthEnd) {
          uncategorizedCount++;
        }
      }
    }

    // Check billing completeness for target month
    const activeClients = allClients.filter(c => c.status === 'active');
    const hybridClientsWithRecord = new Set();
    const nonHybridClientsWithRecord = new Set();
    allBilling.forEach(r => {
      const client = allClients.find(c => c.id === r.client_id);
      if (client?.billing_type === 'hybrid') {
        hybridClientsWithRecord.add(r.client_id);
      } else {
        nonHybridClientsWithRecord.add(r.client_id);
      }
    });
    const missingBillingCount = activeClients.filter(c => {
      if (c.billing_type === 'hybrid') return !hybridClientsWithRecord.has(c.id);
      return !nonHybridClientsWithRecord.has(c.id);
    }).length;

    // Closed months list
    const closedMonths = closedSettings.map(s => s.value).filter(Boolean).sort().reverse();
    const isAlreadyClosed = closedMonths.includes(targetMonth);

    return Response.json({
      targetMonth,
      uncategorizedCount,
      missingBillingCount,
      activeClientCount: activeClients.length,
      closedMonths,
      isAlreadyClosed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});