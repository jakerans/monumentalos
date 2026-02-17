import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and onboard_admins can invite users
    if (user.role !== 'admin' && user.role !== 'onboard_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, intended_role, client_id } = await req.json();

    if (!email || !intended_role) {
      return Response.json({ error: 'email and intended_role are required' }, { status: 400 });
    }

    if (intended_role === 'client' && !client_id) {
      return Response.json({ error: 'client_id is required for client role' }, { status: 400 });
    }

    // Use service role to invite (bypasses user-level permission restrictions)
    const inviteRole = intended_role === 'admin' ? 'admin' : 'user';
    await base44.asServiceRole.functions.invoke('doInviteUser', {
      email: email.trim(),
      role: inviteRole,
    });

    // Create a PendingInvite so the role is applied when the user signs up
    if (intended_role !== 'admin') {
      const inviteData = {
        email: email.trim().toLowerCase(),
        intended_role,
        status: 'pending',
      };
      if (client_id) {
        inviteData.client_id = client_id;
      }
      await base44.asServiceRole.entities.PendingInvite.create(inviteData);
    }

    return Response.json({ success: true, email: email.trim(), intended_role, client_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});