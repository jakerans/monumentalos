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

    if (user.app_role !== 'marketing_manager' && user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { dateStart, dateEnd } = body;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const fetchFrom = dateStart
      ? new Date(new Date(dateStart).getTime() - 70 * 24 * 60 * 60 * 1000)
      : ninetyDaysAgo;

    const sr = base44.asServiceRole.entities;

    // Fetch all data in parallel using service role with pagination safety
    const [clients, allLeads, allSpend, onboardTasks, onboardProjects, employees] = await Promise.all([
      fetchAllFiltered(sr.Client, { status: 'active' }, '-created_date'),
      fetchAllFiltered(sr.Lead, { created_date: { $gte: fetchFrom.toISOString() } }, '-created_date'),
      fetchAll(sr.Spend, '-date'),
      fetchAllFiltered(sr.OnboardTask, { assigned_to: 'marketing_manager' }, '-created_date'),
      fetchAllFiltered(sr.OnboardProject, { status: 'in_progress' }, '-created_date'),
      fetchAllFiltered(sr.Employee, { user_id: user.id, status: 'active' }, '-created_date'),
    ]);

    const now = new Date();

    // Performance pay plans
    let perfPlans = [];
    let perfRecords = [];
    if (employees.length > 0) {
      try {
        perfPlans = await base44.asServiceRole.entities.PerformancePay.filter({
          employee_id: employees[0].id,
          status: 'active',
        });
        // Fetch last month's record for hover summary
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastPeriod = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
        perfRecords = await base44.asServiceRole.entities.PerformancePayRecord.filter({
          employee_id: employees[0].id,
          period: lastPeriod,
        });
      } catch (_e) {
        perfPlans = [];
        perfRecords = [];
      }
    }

    // Pending onboard count
    const myProjectIds = user.app_role === 'admin'
      ? onboardProjects.map(p => p.id)
      : onboardProjects.filter(p => p.assigned_mm_id === user.id).map(p => p.id);
    const pendingOnboardCount = onboardTasks.filter(t =>
      (t.status === 'pending' || t.status === 'in_progress') &&
      myProjectIds.includes(t.project_id)
    ).length;

    // Live billable revenue for perf plans
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdStr = mtdStart.toISOString();

    function getLeadPrice(client, lead, field) {
      const pricing = client.industry_pricing || [];
      const ind = (lead.industries && lead.industries[0]) || null;
      const match = ind ? pricing.find(p => p.industry === ind) : null;
      if (match) return match[field] || 0;
      return field === 'price_per_show' ? (client.price_per_shown_appointment || 0) : (client.price_per_set_appointment || 0);
    }

    let billableRevenue = 0;
    clients.forEach(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = allLeads.filter(l => l.client_id === client.id);
      if (bt === 'pay_per_show') {
        cLeads.filter(l =>
          l.appointment_date && l.appointment_date >= mtdStr &&
          (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost')
        ).forEach(l => { billableRevenue += getLeadPrice(client, l, 'price_per_show'); });
      } else if (bt === 'pay_per_set') {
        cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= mtdStr).forEach(l => { billableRevenue += getLeadPrice(client, l, 'price_per_set'); });
      } else if (bt === 'retainer') {
        billableRevenue += (client.retainer_amount || 0);
      }
    });

    const livePerfPlans = perfPlans.map(plan => {
      if (plan.metric === 'revenue') {
        return { ...plan, current_period_progress: billableRevenue };
      }
      return plan;
    });

    return Response.json({
      clients,
      allLeads,
      allSpend,
      pendingOnboardCount,
      livePerfPlans,
      lastMonthPerfRecords: perfRecords,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});