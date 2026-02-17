import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and onboard_admins can invite client users
    if (user.role !== 'admin' && user.role !== 'onboard_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, client_id } = await req.json();

    if (!email || !client_id) {
      return Response.json({ error: 'email and client_id are required' }, { status: 400 });
    }

    // Invite the user as a "client" role
    await base44.users.inviteUser(email.trim(), 'client');

    // Now find the newly created user by email and set their client_id
    // Use service role to access all users
    const allUsers = await base44.asServiceRole.entities.User.filter({ email: email.trim().toLowerCase() });
    
    if (allUsers.length > 0) {
      const invitedUser = allUsers[0];
      await base44.asServiceRole.entities.User.update(invitedUser.id, { client_id });
    }

    return Response.json({ success: true, email: email.trim(), client_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});