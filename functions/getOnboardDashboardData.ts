import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.app_role !== 'onboard_admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [projects, tasks, templates, clients, allUsers, setterProfiles] = await Promise.all([
      base44.asServiceRole.entities.OnboardProject.list('-created_date', 200),
      base44.asServiceRole.entities.OnboardTask.list('-created_date', 1000),
      base44.asServiceRole.entities.OnboardTemplate.filter({ status: 'active' }),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.SetterProfile.filter({ status: 'active' }),
    ]);

    // Build safe user list matching listTeamUsers format
    const profileMap = {};
    setterProfiles.forEach(p => { profileMap[p.user_id] = p; });
    const users = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      app_role: u.app_role,
      setter_profile: profileMap[u.id] || null,
    }));

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