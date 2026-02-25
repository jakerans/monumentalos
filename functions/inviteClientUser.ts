import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { email, intended_role, client_id } = await req.json();

    if (!email || !intended_role) {
      return Response.json({ error: 'email and intended_role are required' }, { status: 400 });
    }

    if (intended_role === 'client' && !client_id) {
      return Response.json({ error: 'client_id is required for client role' }, { status: 400 });
    }

    // Check auth - allow service role calls too
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // If auth fails, reject
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and onboard_admins can invite users
    if (user.app_role !== 'admin' && user.app_role !== 'onboard_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Invite the user with basic 'user' role (role will be upgraded via PendingInvite on signup)
    const inviteRole = intended_role === 'admin' ? 'admin' : 'user';
    console.log('Inviting user:', email.trim(), 'with platform role:', inviteRole);
    
    let inviteSent = false;
    try {
      console.log('Attempting invite via users.inviteUser...');
      await base44.users.inviteUser(email.trim(), inviteRole);
      inviteSent = true;
      console.log('Invite sent successfully via users.inviteUser');
    } catch (inviteError) {
      console.error('users.inviteUser failed:', inviteError.message, JSON.stringify(inviteError.response?.data || {}));
      try {
        console.log('Falling back to auth.inviteUser...');
        await base44.auth.inviteUser(email.trim(), inviteRole);
        inviteSent = true;
        console.log('Invite sent via auth.inviteUser fallback');
      } catch (authError) {
        console.error('auth.inviteUser also failed:', authError.message, JSON.stringify(authError.response?.data || {}));
      }
    }

    // Create a PendingInvite so the role is applied when the user signs up
    // This applies to all roles including admin
    const inviteData = {
      email: email.trim().toLowerCase(),
      intended_role,
      status: 'pending',
    };
    if (client_id) {
      inviteData.client_id = client_id;
    }
    await base44.asServiceRole.entities.PendingInvite.create(inviteData);
    console.log('PendingInvite created');

    if (!inviteSent) {
      console.warn('Note: Email invitation failed, but user record created. They can sign up normally.');
    }

    return Response.json({ success: true, invite_sent: inviteSent, email: email.trim(), intended_role, client_id });
  } catch (error) {
    console.error('inviteClientUser error:', error.message, error.response?.data);
    return Response.json({ error: error.message, details: error.response?.data }, { status: 500 });
  }
});