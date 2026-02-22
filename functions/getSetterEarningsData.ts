import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function getPayPeriods(freq, now) {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();

  if (freq === 'semi_monthly') {
    let ps, pe, pps, ppe;
    if (d <= 15) {
      ps = new Date(y, m, 1); pe = new Date(y, m, 15);
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      const lastDay = new Date(py, pm + 1, 0).getDate();
      pps = new Date(py, pm, 16); ppe = new Date(py, pm, lastDay);
    } else {
      const lastDay = new Date(y, m + 1, 0).getDate();
      ps = new Date(y, m, 16); pe = new Date(y, m, lastDay);
      pps = new Date(y, m, 1); ppe = new Date(y, m, 15);
    }
    return { ps, pe, pps, ppe };
  }

  if (freq === 'monthly') {
    const ps = new Date(y, m, 1);
    const pe = new Date(y, m + 1, 0);
    const pps = new Date(y, m - 1, 1);
    const ppe = new Date(y, m, 0);
    return { ps, pe, pps, ppe };
  }

  // weekly or biweekly
  const epoch = new Date(2025, 0, 6); // Monday Jan 6 2025
  const msDay = 86400000;
  const totalDays = Math.floor((now.getTime() - epoch.getTime()) / msDay);
  const cycleLen = freq === 'weekly' ? 7 : 14;
  const cycleNum = Math.floor(totalDays / cycleLen);
  const ps = new Date(epoch.getTime() + cycleNum * cycleLen * msDay);
  const pe = new Date(ps.getTime() + (cycleLen - 1) * msDay);
  const pps = new Date(ps.getTime() - cycleLen * msDay);
  const ppe = new Date(ps.getTime() - msDay);
  return { ps, pe, pps, ppe };
}

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

    // Step 2: pay periods
    const { ps, pe, pps, ppe } = getPayPeriods(freq, now);
    const periodStart = fmtDate(ps);
    const periodEnd = fmtDate(pe);
    const prevPeriodStart = fmtDate(pps);
    const prevPeriodEnd = fmtDate(ppe);

    // Step 3-7: parallel data fetch
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEndD = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEnd = fmtDate(monthEndD);

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

    // Step 3: hours
    const hoursThisPeriod = timeEntries
      .filter(e => e.date >= periodStart && e.date <= periodEnd)
      .reduce((s, e) => s + (e.total_hours || 0), 0);
    const hoursLastPeriod = timeEntries
      .filter(e => e.date >= prevPeriodStart && e.date <= prevPeriodEnd)
      .reduce((s, e) => s + (e.total_hours || 0), 0);

    // Step 4: base pay
    let estimatedBase = 0;
    if (emp.classification === 'salary') {
      estimatedBase = emp.pay_per_cycle || 0;
    } else if (emp.classification === 'hourly') {
      estimatedBase = hoursThisPeriod * (emp.hourly_rate || 0);
    } else if (emp.classification === 'contractor') {
      const bt = emp.contractor_billing_type;
      if (bt === 'hourly') estimatedBase = hoursThisPeriod * (emp.contractor_rate || 0);
      else if (bt === 'per_cycle') estimatedBase = emp.pay_per_cycle || 0;
      else if (bt === 'monthly') estimatedBase = (emp.contractor_rate || 0) / (cyclesPerYear / 12);
    }
    estimatedBase = Math.round(estimatedBase * 100) / 100;

    // Step 5: spiff bonuses
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

    // Step 6: loot cash
    const monthLootWins = lootWins.filter(w => w.won_date >= monthStart && w.won_date <= monthEnd && w.prize_type === 'cash');
    const lootCashMonth = monthLootWins.reduce((s, w) => s + (w.cash_value || 0), 0);
    const periodLootWins = monthLootWins.filter(w => w.won_date >= periodStart && w.won_date <= periodEnd);
    const lootCashPeriod = periodLootWins.reduce((s, w) => s + (w.cash_value || 0), 0);

    // Step 7: recent payroll (from Expense records matching this employee)
    const recentPayroll = recentPayrollExpenses
      .filter(e => e.amount > 0)
      .slice(0, 3)
      .map(e => ({ date: e.date, amount: e.amount }));

    const estimatedTotal = Math.round((estimatedBase + pendingSpiffBonus + lootCashPeriod) * 100) / 100;

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
      period_start: periodStart,
      period_end: periodEnd,
      hours_this_period: Math.round(hoursThisPeriod * 100) / 100,
      hours_last_period: Math.round(hoursLastPeriod * 100) / 100,
      estimated_base_pay: estimatedBase,
      pending_spiff_bonus: pendingSpiffBonus,
      loot_cash_this_period: lootCashPeriod,
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