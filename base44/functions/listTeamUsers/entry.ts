import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow admins, onboard_admins, setters, and marketing_managers to list team users
    const allowed = ['admin', 'onboard_admin', 'setter', 'marketing_manager'];
    if (!allowed.includes(user.app_role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch setter profiles (public, no permission issues)
    const setterProfiles = await base44.asServiceRole.entities.SetterProfile.filter({ status: 'active' });

    // Also get full user list via service role for admin/MM needs
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Return only safe fields
    const safeUsers = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      app_role: u.app_role,
    }));

    // Merge setter profiles into user data
    const profileMap = {};
    setterProfiles.forEach(p => { profileMap[p.user_id] = p; });

    const enrichedUsers = safeUsers.map(u => ({
      ...u,
      setter_profile: profileMap[u.id] || null,
    }));

    return Response.json({ users: enrichedUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});