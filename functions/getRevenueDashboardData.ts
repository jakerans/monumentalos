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

function inMonth(dateStr, mStart, mEnd) {
  if (!dateStr) return false;
  const dt = new Date(dateStr);
  return dt >= mStart && dt <= mEnd;
}

function buildMonthBuckets(refDate, count) {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    months.push({
      year: d.getFullYear(), month: d.getMonth(),
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: d, end: mEnd,
    });
  }
  return months;
}

function getLeadPrice(client, lead, field) {
  const pricing = client.industry_pricing || [];
  const ind = (lead.industries && lead.industries[0]) || null;
  const match = ind ? pricing.find(p => p.industry === ind) : null;
  if (match) return match[field] || 0;
  return field === 'price_per_show' ? (client.price_per_shown_appointment || 0) : (client.price_per_set_appointment || 0);
}

function computeMonthlyPL(months, clients, leads, billingRecords, expenses) {
  const activeClients = clients.filter(c => c.status === 'active');
  return months.map(m => {
    const ir = (d) => inMonth(d, m.start, m.end);
    let grossRevenue = 0;
    activeClients.forEach(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = leads.filter(l => l.client_id === client.id);
      if (bt === 'pay_per_show') cLeads.filter(l => l.disposition === 'showed' && ir(l.appointment_date)).forEach(l => { grossRevenue += getLeadPrice(client, l, 'price_per_show'); });
      else if (bt === 'pay_per_set') cLeads.filter(l => l.date_appointment_set && ir(l.date_appointment_set)).forEach(l => { grossRevenue += getLeadPrice(client, l, 'price_per_set'); });
      else if (bt === 'retainer') grossRevenue += (client.retainer_amount || 0);
    });
    const collected = billingRecords.filter(b => b.status === 'paid' && ir(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
    const mExp = expenses.filter(e => ir(e.date) && e.expense_type !== 'distribution' && e.category !== 'distribution');
    const cogs = mExp.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
    const overhead = mExp.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
    return {
      name: m.label, Revenue: Math.round(grossRevenue), Collected: Math.round(collected),
      COGS: Math.round(cogs), Overhead: Math.round(overhead),
      'Gross Profit': Math.round(grossRevenue - cogs), 'Net Profit': Math.round(collected - cogs - overhead),
    };
  });
}

function computeCashFlow(months, billingRecords, expenses) {
  let cumulative = 0;
  return months.map(m => {
    const ir = (d) => inMonth(d, m.start, m.end);
    const inflows = billingRecords.filter(b => b.status === 'paid' && ir(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
    const opEx = expenses.filter(e => ir(e.date) && e.expense_type !== 'distribution' && e.category !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
    const distributions = expenses.filter(e => ir(e.date) && (e.expense_type === 'distribution' || e.category === 'distribution')).reduce((s, e) => s + (e.amount || 0), 0);
    const net = inflows - opEx - distributions;
    cumulative += net;
    return { name: m.label, Inflows: Math.round(inflows), 'Operating Expenses': Math.round(opEx), Distributions: Math.round(distributions), 'Net Cash Flow': Math.round(net), Cumulative: Math.round(cumulative) };
  });
}

function computePeriodKPIs(clients, leads, billingRecords, expenses, startDate, endDate) {
  const start = new Date(startDate); start.setHours(0,0,0,0);
  const end = new Date(endDate); end.setHours(23,59,59,999);
  const ir = (d) => { if (!d) return false; const dt = new Date(d); return dt >= start && dt <= end; };
  let grossRevenue = 0;
  clients.filter(c => c.status === 'active').forEach(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);
    if (bt === 'pay_per_show') cLeads.filter(l => l.disposition === 'showed' && ir(l.appointment_date)).forEach(l => { grossRevenue += getLeadPrice(client, l, 'price_per_show'); });
    else if (bt === 'pay_per_set') cLeads.filter(l => l.date_appointment_set && ir(l.date_appointment_set)).forEach(l => { grossRevenue += getLeadPrice(client, l, 'price_per_set'); });
    else if (bt === 'retainer') grossRevenue += (client.retainer_amount || 0);
  });
  const collected = billingRecords.filter(b => b.status === 'paid' && ir(b.paid_date)).reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
  const re = expenses.filter(e => ir(e.date) && e.expense_type !== 'distribution' && e.category !== 'distribution');
  const cogs = re.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const overhead = re.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const grossProfit = grossRevenue - cogs;
  const netProfit = collected - cogs - overhead;
  return { grossRevenue, collected, outstanding: grossRevenue - collected, cogs, overhead, grossProfit, netProfit, grossMargin: grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0, netMargin: collected > 0 ? (netProfit / collected) * 100 : 0 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { revFetchStart, startDate, endDate } = await req.json();
    const sr = base44.asServiceRole.entities;

    const [clients, leads, billingRecords, expenses] = await Promise.all([
      sr.Client.list(),
      fetchAllFiltered(sr.Lead, { created_date: { $gte: revFetchStart } }, '-created_date'),
      fetchAllFiltered(sr.MonthlyBilling, { created_date: { $gte: revFetchStart } }, '-billing_month'),
      fetchAllFiltered(sr.Expense, { date: { $gte: revFetchStart } }, '-date'),
    ]);

    const now = new Date();
    const months = buildMonthBuckets(now, 6);
    const monthlyPL = computeMonthlyPL(months, clients, leads, billingRecords, expenses);
    const cashFlowData = computeCashFlow(months, billingRecords, expenses);

    let kpis = null;
    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      const rangeDays = Math.round((ed - sd) / (24*60*60*1000)) + 1;
      const priorEnd = new Date(sd); priorEnd.setDate(priorEnd.getDate() - 1);
      const priorStart = new Date(sd); priorStart.setDate(priorStart.getDate() - rangeDays);
      const cur = computePeriodKPIs(clients, leads, billingRecords, expenses, startDate, endDate);
      const pri = computePeriodKPIs(clients, leads, billingRecords, expenses, priorStart.toISOString().split('T')[0], priorEnd.toISOString().split('T')[0]);
      kpis = { current: cur, prior: pri };
    }

    const paidBilling = billingRecords.filter(b => b.status === 'paid');
    const clientSummary = clients.filter(c => c.status === 'active').map(c => {
      const bt = c.billing_type || 'pay_per_show';
      const cLeads = leads.filter(l => l.client_id === c.id);
      const cBilling = paidBilling.filter(b => b.client_id === c.id);
      const ltv = cBilling.reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
      let allTimeBilled = 0;
      if (bt === 'pay_per_show') cLeads.filter(l => l.disposition === 'showed').forEach(l => { allTimeBilled += getLeadPrice(c, l, 'price_per_show'); });
      else if (bt === 'pay_per_set') cLeads.filter(l => l.date_appointment_set).forEach(l => { allTimeBilled += getLeadPrice(c, l, 'price_per_set'); });
      else if (bt === 'retainer') {
        const dates = [...cBilling.map(b => b.paid_date), ...cLeads.map(l => l.created_date)].filter(Boolean).sort();
        if (dates.length > 0) { const mths = Math.max(1, Math.ceil((now - new Date(dates[0])) / (30*24*60*60*1000))); allTimeBilled = (c.retainer_amount || 0) * mths; }
      }
      return { id: c.id, name: c.name, billing_type: bt, ltv, outstanding: Math.max(0, allTimeBilled - ltv) };
    });

    return Response.json({
      clients,
      billingRecords,
      expenses,
      monthlyPL,
      cashFlowData,
      kpis,
      clientSummary,
    });
  } catch (error) {
    console.error('getRevenueDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});