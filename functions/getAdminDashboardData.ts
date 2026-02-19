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

function pctChange(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prior) / prior) * 100);
}

function buildDailySparkline(items, dateKey, days = 14) {
  const now = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    data.push({ v: items.filter(item => (item[dateKey] || '').startsWith(dayStr)).length });
  }
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    const [clients, leads, spend, expenses, goals, billingRecords, users, spiffs] = await Promise.all([
      sr.Client.list(),
      fetchAll(sr.Lead, '-created_date'),
      fetchAll(sr.Spend, '-date'),
      fetchAll(sr.Expense, '-date'),
      sr.CompanyGoal.list(),
      fetchAll(sr.MonthlyBilling, '-billing_month'),
      sr.User.list(),
      fetchAllFiltered(sr.Spiff, { status: 'active' }, '-created_date'),
    ]);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const inMTD = (d) => d && new Date(d) >= thisMonthStart;
    const inLM = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lastMonthStart && dt <= lastMonthEnd; };

    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthStr = `${lastMonthStart.getFullYear()}-${String(lastMonthStart.getMonth() + 1).padStart(2, '0')}`;

    // ========== Business Health KPIs ==========
    const activeClients = clients.filter(c => c.status === 'active');
    const inactiveClients = clients.filter(c => c.status === 'inactive');
    const newClientsThisMonth = clients.filter(c => inMTD(c.created_date)).length;
    const newClientsLastMonth = clients.filter(c => inLM(c.created_date)).length;

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const churnedCount = inactiveClients.filter(c => c.deactivated_date && new Date(c.deactivated_date) >= ninetyDaysAgo).length;
    const baseCount = activeClients.length + churnedCount;
    const churnRate = baseCount > 0 ? Math.round((churnedCount / baseCount) * 100) : 0;

    const alertClients = activeClients.filter(c => {
      if (c.goal_status === 'behind_wont_meet') return true;
      const cLeads = leads.filter(l => l.client_id === c.id);
      const mtdBooked = cLeads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length;
      const mtdSpend = spend.filter(s => s.client_id === c.id && inMTD(s.date)).reduce((s, r) => s + (r.amount || 0), 0);
      if (mtdSpend > 500 && mtdBooked === 0) return true;
      if (mtdBooked > 0 && (mtdSpend / mtdBooked) > 300) return true;
      return false;
    });

    const lastMonthBilling = billingRecords.filter(b => b.billing_month === lastMonthStr);
    const lastMonthBilledTotal = lastMonthBilling.reduce((s, b) => s + (b.billing_type === 'retainer' ? (b.manual_amount || b.calculated_amount || 0) : (b.calculated_amount || 0)), 0);
    const lastMonthCollected = lastMonthBilling.filter(b => b.status === 'paid').reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
    const collectionRate = lastMonthBilledTotal > 0 ? Math.round((lastMonthCollected / lastMonthBilledTotal) * 100) : 0;

    const mtdLeads = leads.filter(l => inMTD(l.created_date)).length;
    const mtdBooked = leads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length;
    const lmLeads = leads.filter(l => inLM(l.created_date)).length;
    const lmBooked = leads.filter(l => l.date_appointment_set && inLM(l.date_appointment_set)).length;

    const leadsSparkline = buildDailySparkline(leads, 'created_date');
    const bookedSparkline = buildDailySparkline(leads.filter(l => l.date_appointment_set), 'date_appointment_set');

    // ========== Cash Health Metrics ==========
    const paidBillingRecords = billingRecords.filter(b => b.status === 'paid');
    const realizedRevenue = paidBillingRecords.filter(b => inMTD(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);

    const lastMonthUnpaid = billingRecords
      .filter(b => b.billing_month === lastMonthStr && b.status !== 'paid')
      .reduce((s, b) => s + (b.paid_amount || b.calculated_amount || b.manual_amount || 0), 0);

    let liveAccruals = 0;
    activeClients.forEach(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = leads.filter(l => l.client_id === client.id);
      if (bt === 'pay_per_show') {
        liveAccruals += cLeads.filter(l => l.disposition === 'showed' && inMTD(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
      } else if (bt === 'pay_per_set') {
        liveAccruals += cLeads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
      } else if (bt === 'retainer') {
        liveAccruals += (client.retainer_amount || 0);
      }
    });

    const projectedRevenue = lastMonthUnpaid + liveAccruals;
    const unbilledRevenue = Math.max(0, projectedRevenue - realizedRevenue);

    // ========== Accrued Expense & Real-Time Margin ==========
    const [employees, perfPlans, perfRecords, companySettings] = await Promise.all([
      fetchAll(sr.Employee, '-created_date'),
      fetchAll(sr.PerformancePay, '-created_date'),
      fetchAll(sr.PerformancePayRecord, '-created_date'),
      sr.CompanySettings.filter({ key: 'payroll' }, '-created_date', 1),
    ]);
    const activeEmployees = employees.filter(e => e.status === 'active');
    const payrollSettings = companySettings[0] || {};

    // Payroll cycles per year
    const freq = payrollSettings.payroll_frequency || 'biweekly';
    const cyclesPerYear = freq === 'weekly' ? 52 : freq === 'biweekly' ? 26 : freq === 'semi_monthly' ? 24 : 12;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const proRataFraction = dayOfMonth / daysInMonth;

    let accruedSalary = 0;
    activeEmployees.forEach(emp => {
      let monthlyCost = 0;
      if (emp.classification === 'salary' && emp.pay_per_cycle) {
        monthlyCost = (emp.pay_per_cycle * cyclesPerYear) / 12;
      } else if (emp.classification === 'hourly') {
        monthlyCost = (emp.hourly_rate || 0) * (emp.standard_monthly_hours || 160);
      } else if (emp.classification === 'contractor') {
        if (emp.contractor_billing_type === 'per_cycle' && emp.pay_per_cycle) monthlyCost = (emp.pay_per_cycle * cyclesPerYear) / 12;
        else if (emp.contractor_billing_type === 'monthly') monthlyCost = emp.contractor_rate || 0;
        else if (emp.contractor_billing_type === 'hourly') monthlyCost = (emp.contractor_rate || 0) * 160;
      }
      accruedSalary += monthlyCost * proRataFraction;
    });

    // Performance Pay Accrual: current month unpaid + previous month unpaid
    const activePerfPlans = perfPlans.filter(p => p.status === 'active');
    let accruedPerfPay = 0;

    activePerfPlans.forEach(plan => {
      // Current month accrued payout
      accruedPerfPay += (plan.current_period_payout || 0);

      // Check if previous month was paid via PerformancePayRecord
      const prevMonthPaid = perfRecords.some(r =>
        r.performance_pay_id === plan.id && r.period === lastMonthStr && r.status === 'paid'
      );
      if (!prevMonthPaid) {
        // Previous month unpaid – check if there's a calculated record
        const prevCalc = perfRecords.find(r =>
          r.performance_pay_id === plan.id && r.period === lastMonthStr && r.status === 'calculated'
        );
        if (prevCalc) {
          accruedPerfPay += (prevCalc.payout || 0);
        }
      }
    });

    const totalAccruedPayroll = accruedSalary + accruedPerfPay;

    const recordedExpensesMTD = expenses.filter(e => inMTD(e.date) && e.expense_type !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
    const recordedCogsMTD = expenses.filter(e => inMTD(e.date) && e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);

    const totalAccruedExpenses = Math.max(totalAccruedPayroll, recordedExpensesMTD);
    const accruedGrossProfit = projectedRevenue - Math.max(totalAccruedPayroll * 0.6, recordedCogsMTD);
    const accruedGrossMargin = projectedRevenue > 0 ? (accruedGrossProfit / projectedRevenue) * 100 : 0;

    const realtimeNetProfit = realizedRevenue - totalAccruedExpenses;
    const realtimeNetMargin = realizedRevenue > 0 ? (realtimeNetProfit / realizedRevenue) * 100 : 0;

    // ========== Retainer Coverage Ratio ==========
    const monthlyRetainerRevenue = activeClients
      .filter(c => (c.billing_type || 'pay_per_show') === 'retainer')
      .reduce((s, c) => s + (c.retainer_amount || 0), 0);

    const monthlyFixedOverhead = activeEmployees.reduce((s, emp) => {
      let monthlyCost = 0;
      if (emp.classification === 'salary' && emp.pay_per_cycle) monthlyCost = emp.pay_per_cycle * 2.167;
      else if (emp.classification === 'hourly') monthlyCost = (emp.hourly_rate || 0) * (emp.standard_monthly_hours || 160);
      else if (emp.classification === 'contractor' && emp.contractor_billing_type === 'monthly') monthlyCost = emp.contractor_rate || 0;
      return s + monthlyCost;
    }, 0);
    const softwareExpenses90d = expenses
      .filter(e => e.category === 'software' && new Date(e.date) >= ninetyDaysAgo)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const monthlySoftware = softwareExpenses90d / 3;
    const totalFixedOverhead = monthlyFixedOverhead + monthlySoftware;
    const retainerCoverageRatio = totalFixedOverhead > 0 ? Math.round((monthlyRetainerRevenue / totalFixedOverhead) * 100) : 0;

    // ========== AR Health Light ==========
    let arHealth = 'green';
    billingRecords.forEach(bill => {
      if (bill.status === 'paid') return;
      const [y, m] = (bill.billing_month || '').split('-').map(Number);
      if (!y || !m) return;
      const invoiceDate = new Date(y, m, 1);
      const daysPastDue = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
      const amount = bill.calculated_amount || bill.manual_amount || 0;

      if (daysPastDue >= 15 && amount > 0) {
        arHealth = 'red';
      } else if (daysPastDue >= 7 && amount >= 1000 && arHealth !== 'red') {
        arHealth = 'yellow';
      }
    });

    const cashHealth = {
      realizedRevenue,
      projectedRevenue,
      activeInvoices: lastMonthUnpaid,
      liveAccruals,
      unbilledRevenue,
      accruedExpenses: totalAccruedExpenses,
      accruedSalary: Math.round(accruedSalary),
      accruedPerfPay: Math.round(accruedPerfPay),
      accruedGrossMargin,
      realtimeNetProfit,
      realtimeNetMargin,
      retainerCoverageRatio,
      monthlyRetainerRevenue,
      totalFixedOverhead,
      arHealth,
      proRataFraction,
    };

    const healthKPIs = {
      activeClients: activeClients.length,
      alertClients: alertClients.length,
      churnRate,
      churnedCount,
      newClientsThisMonth,
      newClientsLastMonth,
      lastMonthBilledTotal,
      lastMonthCollected,
      collectionRate,
      mtdLeads,
      mtdBooked,
      lmLeads,
      lmBooked,
      leadsSparkline,
      bookedSparkline,
    };

    // ========== Client Goal Chart ==========
    const goalChartData = (() => {
      const statuses = ['goal_met', 'on_track', 'behind_confident', 'behind_wont_meet', 'no_goal'];
      const counts = {};
      statuses.forEach(s => {
        counts[s] = s === 'no_goal'
          ? activeClients.filter(c => !c.goal_status).length
          : activeClients.filter(c => c.goal_status === s).length;
      });
      const total = activeClients.length;
      const goalMet = counts['goal_met'];
      const onTrack = counts['on_track'];
      const healthyPct = total > 0 ? Math.round(((goalMet + onTrack) / total) * 100) : 0;
      return { counts, total, healthyPct };
    })();

    // ========== Revenue Breakdown Chart ==========
    const revenueBreakdown = (() => {
      const types = ['pay_per_show', 'pay_per_set', 'retainer'];
      const result = {};
      types.forEach(bt => {
        let revenue = 0;
        const btClients = clients.filter(c => c.status === 'active' && (c.billing_type || 'pay_per_show') === bt);
        btClients.forEach(client => {
          const cLeads = leads.filter(l => l.client_id === client.id);
          if (bt === 'pay_per_show') {
            revenue += cLeads.filter(l => l.disposition === 'showed' && inMTD(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
          } else if (bt === 'pay_per_set') {
            revenue += cLeads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
          } else if (bt === 'retainer') {
            revenue += (client.retainer_amount || 0);
          }
        });
        result[bt] = { revenue, count: btClients.length };
      });
      return result;
    })();

    // ========== P&L / MTD Data ==========
    const calcPeriod = (rangeFn) => {
      let grossRevenue = 0;
      activeClients.forEach(client => {
        const bt = client.billing_type || 'pay_per_show';
        const cLeads = leads.filter(l => l.client_id === client.id);
        if (bt === 'pay_per_show') {
          grossRevenue += cLeads.filter(l => l.disposition === 'showed' && rangeFn(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
        } else if (bt === 'pay_per_set') {
          grossRevenue += cLeads.filter(l => l.date_appointment_set && rangeFn(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
        } else if (bt === 'retainer') {
          grossRevenue += (client.retainer_amount || 0);
        }
      });
      const collected = paidBillingRecords.filter(b => rangeFn(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
      const rangeExpenses = expenses.filter(e => rangeFn(e.date) && e.expense_type !== 'distribution');
      const cogs = rangeExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const overhead = rangeExpenses.filter(e => e.expense_type === 'overhead').reduce((s, e) => s + (e.amount || 0), 0);
      const grossProfit = grossRevenue - cogs;
      const netProfit = collected - cogs - overhead;
      const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
      const netMargin = collected > 0 ? (netProfit / collected) * 100 : 0;
      return { grossRevenue, collected, cogs, overhead, grossProfit, netProfit, grossMargin, netMargin };
    };

    const mtdPL = calcPeriod(inMTD);
    const priorPL = calcPeriod(inLM);

    // ========== Stat Compare (Income vs Expenses) ==========
    const mtdIncome = paidBillingRecords.filter(b => inMTD(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
    const mtdExpenses = expenses.filter(e => inMTD(e.date) && e.expense_type !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
    const lmIncome = paidBillingRecords.filter(b => inLM(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
    const lmExpenses = expenses.filter(e => inLM(e.date) && e.expense_type !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
    const cogsTotal = expenses.filter(e => inMTD(e.date) && e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
    const overheadTotal = mtdExpenses - cogsTotal;
    const chartData14 = (() => {
      const now2 = new Date();
      const data = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now2);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayBillingIncome = paidBillingRecords.filter(b => (b.paid_date || '').startsWith(dayStr)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
        const dayExpense = expenses.filter(e => (e.date || '').startsWith(dayStr) && e.expense_type !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
        data.push({ label: dayLabel, income: dayBillingIncome, expenses: dayExpense });
      }
      return data;
    })();

    const statCompare = {
      mtdIncome,
      mtdExpenses,
      lmIncome,
      lmExpenses,
      cogsTotal,
      overheadTotal,
      chartData14,
    };

    // ========== Setter Leaderboard ==========
    const setters = users.filter(u => u.app_role === 'setter');
    const setterStats = setters.map(setter => {
      const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart).length;
      const stlLeads = leads.filter(l => l.setter_id === setter.id && l.speed_to_lead_minutes != null && new Date(l.created_date) >= thisMonthStart);
      const avgSTL = stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      return { name: setter.full_name, booked, avgSTL };
    }).sort((a, b) => b.booked - a.booked);

    // ========== Goals ==========
    const currentGoal = goals.find(g => g.month === currentMonthStr) || null;

    return Response.json({
      healthKPIs,
      cashHealth,
      goalChartData,
      revenueBreakdown,
      mtdPL,
      priorPL,
      statCompare,
      setterStats,
      currentGoal,
      goals,
      billingRecords: lastMonthBilling,
      clients,
      spiffs,
    });
  } catch (error) {
    console.error('getAdminDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});