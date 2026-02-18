import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.app_role !== 'onboard_admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [projects, tasks, templates, clients, usersRes] = await Promise.all([
      base44.asServiceRole.entities.OnboardProject.list('-created_date', 200),
      base44.asServiceRole.entities.OnboardTask.list('-created_date', 1000),
      base44.asServiceRole.entities.OnboardTemplate.filter({ status: 'active' }),
      base44.asServiceRole.entities.Client.list(),
      base44.functions.invoke('listTeamUsers'),
    ]);

    const users = usersRes?.users || [];

    return Response.json({
      projects,
      tasks,
      templates,
      clients,
      users,
    });
  } catch (error) {
    console.error('getOnboardDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});