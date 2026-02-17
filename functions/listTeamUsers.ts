import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and onboard_admins can list team users
    if (user.app_role !== 'admin' && user.app_role !== 'onboard_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();

    // Return only safe fields
    const safeUsers = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      app_role: u.app_role,
    }));

    return Response.json({ users: safeUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});