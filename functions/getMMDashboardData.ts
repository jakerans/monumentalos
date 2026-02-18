import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { dateStart, dateEnd } = body;

    // Fetch all data in parallel using service role
    const [clients, allLeads, allSpend, onboardTasks, onboardProjects, employees] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ status: 'active' }),
      base44.asServiceRole.entities.Lead.list('-created_date', 5000),
      base44.asServiceRole.entities.Spend.list('-date', 5000),
      base44.asServiceRole.entities.OnboardTask.filter({ assigned_to: 'marketing_manager' }),
      base44.asServiceRole.entities.OnboardProject.filter({ status: 'in_progress' }),
      base44.asServiceRole.entities.Employee.filter({ user_id: user.id, status: 'active' }),
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