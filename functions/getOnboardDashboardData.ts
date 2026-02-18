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
    const role = user.app_role || user.role;
    if (role !== 'admin' && role !== 'onboard_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    // Core data in parallel with pagination safety
    const [projects, tasks, templates, clients] = await Promise.all([
      fetchAll(sr.OnboardProject, '-created_date'),
      fetchAll(sr.OnboardTask, '-created_date'),
      fetchAllFiltered(sr.OnboardTemplate, { status: 'active' }, '-created_date'),
      sr.Client.list(),
    ]);

    // Users call wrapped in try/catch for resilience
    let users = [];
    try {
      users = await base44.asServiceRole.entities.User.list();
    } catch (e) {
      console.warn('Failed to fetch users:', e.message);
    }

    const mmUsers = users.filter(u => u.app_role === 'marketing_manager' || u.app_role === 'admin');

    // Pre-aggregate KPIs
    const active = projects.filter(p => p.status === 'in_progress');
    const completed = projects.filter(p => p.status === 'completed');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentCompleted = completed.filter(p => p.completed_date && new Date(p.completed_date) >= ninetyDaysAgo);

    let avgDays = null;
    if (recentCompleted.length > 0) {
      const totalDays = recentCompleted.reduce((sum, p) => {
        const start = new Date(p.started_date || p.created_date);
        const end = new Date(p.completed_date);
        return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = parseFloat((totalDays / recentCompleted.length).toFixed(1));
    }

    const pendingTaskCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

    return Response.json({
      projects,
      tasks,
      templates,
      clients,
      mmUsers,
      kpis: {
        activeCount: active.length,
        completedCount: completed.length,
        avgDays,
        pendingTaskCount,
      },
    });
  } catch (error) {
    console.error('getOnboardDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});