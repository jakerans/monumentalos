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

    const body = await req.json().catch(() => ({}));
    const { dateStart, dateEnd } = body;

    const sr = base44.asServiceRole.entities;

    // Fetch all data in parallel using service role with pagination safety
    const [clients, allLeads, allSpend, onboardTasks, onboardProjects, employees] = await Promise.all([
      fetchAllFiltered(sr.Client, { status: 'active' }, '-created_date'),
      fetchAll(sr.Lead, '-created_date'),
      fetchAll(sr.Spend, '-date'),
      fetchAllFiltered(sr.OnboardTask, { assigned_to: 'marketing_manager' }, '-created_date'),
      fetchAllFiltered(sr.OnboardProject, { status: 'in_progress' }, '-created_date'),
      fetchAllFiltered(sr.Employee, { user_id: user.id, status: 'active' }, '-created_date'),
    ]);

    // Performance pay plans
    let perfPlans = [];
    if (employees.length > 0) {
      perfPlans = await base44.asServiceRole.entities.PerformancePay.filter({
        employee_id: employees[0].id,
        status: 'active',
      });
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
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdStr = mtdStart.toISOString();

    let billableRevenue = 0;
    clients.forEach(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = allLeads.filter(l => l.client_id === client.id);
      if (bt === 'pay_per_show') {
        const showed = cLeads.filter(l =>
          l.appointment_date && l.appointment_date >= mtdStr &&
          (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost')
        ).length;
        billableRevenue += showed * (client.price_per_shown_appointment || 0);
      } else if (bt === 'pay_per_set') {
        const set = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= mtdStr).length;
        billableRevenue += set * (client.price_per_set_appointment || 0);
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});