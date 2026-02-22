import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.app_role !== 'setter' && user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;
    const now = new Date();

    // Step 1: employee + payroll settings
    const [employees, companySettings] = await Promise.all([
      sr.Employee.filter({ user_id: user.id, status: 'active' }, '-created_date', 1),
      sr.CompanySettings.filter({ key: 'payroll' }, '-created_date', 1),
    ]);

    if (employees.length === 0) {
      return Response.json({ no_employee_record: true });
    }

    const emp = employees[0];
    const payrollSettings = companySettings[0] || {};
    const freq = payrollSettings.payroll_frequency || 'biweekly';
    const cyclesMap = { weekly: 52, biweekly: 26, semi_monthly: 24, monthly: 12 };
    const cyclesPerYear = cyclesMap[freq] || 26;

    // Monthly date ranges
    const monthStart = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const prevMonthStart = fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = fmtDate(new Date(now.getFullYear(), now.getMonth(), 0));
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Parallel data fetch
    const [timeEntries, spiffs, leads, lootWins, recentPayrollExpenses] = await Promise.all([
      sr.TimeEntry.filter({ setter_id: user.id, status: 'completed' }, '-date', 500),
      sr.Spiff.filter({ status: 'active' }, '-created_date', 200),
      sr.Lead.filter({
        booked_by_setter_id: user.id,
        date_appointment_set: { $gte: monthStart + 'T00:00:00' }
      }, '-date_appointment_set', 500),
      sr.LootWin.filter({ setter_id: user.id }, '-won_date', 200),
      sr.Expense.filter({ category: 'payroll', vendor: emp.full_name }, '-date', 30),
    ]);

    // Hours
    const hoursThisMonth = timeEntries
      .filter(e => e.date >= monthStart && e.date <= monthEnd)
      .reduce((s, e) => s + (e.total_hours || 0), 0);
    const hoursLastMonth = timeEntries
      .filter(e => e.date >= prevMonthStart && e.date <= prevMonthEnd)
      .reduce((s, e) => s + (e.total_hours || 0), 0);

    // Base pay (monthly estimate)
    let estimatedBase = 0;
    if (emp.classification === 'salary') {
      estimatedBase = ((emp.pay_per_cycle || 0) * cyclesPerYear) / 12;
    } else if (emp.classification === 'hourly') {
      estimatedBase = hoursThisMonth * (emp.hourly_rate || 0);
    } else if (emp.classification === 'contractor') {
      const bt = emp.contractor_billing_type;
      if (bt === 'hourly') estimatedBase = hoursThisMonth * (emp.contractor_rate || 0);
      else if (bt === 'per_cycle') estimatedBase = ((emp.pay_per_cycle || 0) * cyclesPerYear) / 12;
      else if (bt === 'monthly') estimatedBase = emp.contractor_rate || 0;
    }
    estimatedBase = Math.round(estimatedBase * 100) / 100;

    // Spiff bonuses
    const myMonthlyBookings = leads.length;
    const spiffDetails = [];
    let pendingSpiffBonus = 0;

    for (const sp of spiffs) {
      const isEligible =
        sp.scope === 'team_each' || sp.scope === 'team_company' ||
        (sp.scope === 'individual' && sp.assigned_setter_id === user.id);
      if (!isEligible) continue;
      if (sp.qualifier !== 'appointments') continue;

      const met = myMonthlyBookings >= (sp.goal_value || 0);
      const reward = sp.cash_value || 0;
      spiffDetails.push({
        title: sp.title,
        goal: sp.goal_value || 0,
        progress: myMonthlyBookings,
        reward,
        met,
      });
      if (met) pendingSpiffBonus += reward;
    }

    // Loot cash (monthly)
    const monthLootWins = lootWins.filter(w => w.won_date >= monthStart && w.won_date <= monthEnd && w.prize_type === 'cash');
    const lootCashMonth = monthLootWins.reduce((s, w) => s + (w.cash_value || 0), 0);

    // Recent payroll
    const recentPayroll = recentPayrollExpenses
      .filter(e => e.amount > 0)
      .slice(0, 3)
      .map(e => ({ date: e.date, amount: e.amount }));

    const estimatedTotal = Math.round((estimatedBase + pendingSpiffBonus + lootCashMonth) * 100) / 100;

    return Response.json({
      employee: {
        full_name: emp.full_name,
        classification: emp.classification,
        hourly_rate: emp.hourly_rate,
        pay_per_cycle: emp.pay_per_cycle,
        contractor_rate: emp.contractor_rate,
        contractor_billing_type: emp.contractor_billing_type,
      },
      payroll_frequency: freq,
      month_label: monthLabel,
      month_start: monthStart,
      month_end: monthEnd,
      hours_this_month: Math.round(hoursThisMonth * 100) / 100,
      hours_last_month: Math.round(hoursLastMonth * 100) / 100,
      estimated_base_pay: estimatedBase,
      pending_spiff_bonus: pendingSpiffBonus,
      loot_cash_this_month: lootCashMonth,
      loot_wins_this_month: monthLootWins.length,
      estimated_total: estimatedTotal,
      recent_payroll: recentPayroll,
      spiff_details: spiffDetails,
    });
  } catch (error) {
    console.error('getSetterEarningsData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});