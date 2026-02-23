import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const allowed = ['admin', 'finance_admin'];
    if (!allowed.includes(user.app_role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    // Fetch in parallel
    const [uncategorizedByCat, uncategorizedByType, allBilling, allExpenses, closedMonths] = await Promise.all([
      sr.Expense.filter({ category: 'uncategorized' }, '-date', 1000),
      sr.Expense.filter({ expense_type: 'uncategorized' }, '-date', 1000),
      sr.MonthlyBilling.filter({}, '-billing_month', 5000),
      sr.Expense.filter({ category: 'payroll' }, '-date', 50),
      sr.CompanySettings.filter({ key: 'closed_month' }, '-created_date', 100),
    ]);

    // 1. Expense categorization — deduplicated uncategorized count
    const seenIds = new Set();
    let uncategorizedCount = 0;
    for (const e of [...uncategorizedByCat, ...uncategorizedByType]) {
      if (!seenIds.has(e.id)) { seenIds.add(e.id); uncategorizedCount++; }
    }

    // 2. Billing — current month stats + total AR across all time
    const pendingCount = allBilling.filter(b => b.status === 'pending').length;
    const overdueCount = allBilling.filter(b => b.status === 'overdue').length;
    const totalAR = allBilling
      .filter(b => b.status !== 'paid')
      .reduce((s, b) => s + (b.paid_amount || b.manual_amount || b.calculated_amount || 0), 0);
    const lastWeekBilling = allBilling.filter(b => {
      if (!b.updated_date) return false;
      const d = new Date(b.updated_date);
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
    const lastBillingReviewDate = lastWeekBilling.length > 0
      ? lastWeekBilling.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))[0].updated_date
      : null;

    // 3. Monthly close — check if current month is closed
    const closedSet = new Set(closedMonths.map(s => s.value));
    const closeTarget = now.getDate() <= 5 ? lastMonth : currentMonth;
    const closedAlready = closedSet.has(closeTarget);

    // 4. Payroll — last payroll run date
    const lastPayrollExpense = allExpenses
      .filter(e => e.category === 'payroll')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    const lastPayrollDate = lastPayrollExpense?.date || null;

    return Response.json({
      expenses: { uncategorizedCount },
      billing: { pendingCount, overdueCount, totalAR: Math.round(totalAR * 100) / 100, lastReviewDate: lastBillingReviewDate },
      monthlyClose: { closeTarget, closedAlready, lastMonth, currentMonth },
      payroll: { lastPayrollDate },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});