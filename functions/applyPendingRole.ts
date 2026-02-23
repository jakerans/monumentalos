import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('applyPendingRole called for:', user.email, 'current app_role:', user.app_role, 'platform role:', user.role);

    // If user already has an app_role, just return it
    if (user.app_role) {
      console.log('User already has app_role:', user.app_role);
      return Response.json({ applied: true, role: user.app_role, client_id: user.client_id || null });
    }

    // Check for a pending invite matching this user's email
    const pending = await base44.asServiceRole.entities.PendingInvite.filter({
      email: user.email.toLowerCase(),
      status: 'pending',
    });

    console.log('Found pending invites:', pending.length);

    if (pending.length === 0) {
      // For admin platform users with no pending invite, set app_role to admin
      if (user.role === 'admin') {
        console.log('Admin user with no invite, setting app_role to admin');
        await base44.asServiceRole.entities.User.update(user.id, { app_role: 'admin' });

        // Auto-link Employee record if one exists with matching email
        try {
          const matchingEmployees = await base44.asServiceRole.entities.Employee.filter({
            email: user.email.toLowerCase(),
          }, '-created_date', 10);

          const unlinkable = matchingEmployees.find(e => !e.user_id);
          if (unlinkable) {
            await base44.asServiceRole.entities.Employee.update(unlinkable.id, { user_id: user.id });
            console.log('Auto-linked Employee', unlinkable.id, 'to User', user.id);
          }
        } catch (linkErr) {
          console.error('Employee auto-link failed (non-fatal):', linkErr.message);
        }

        return Response.json({ applied: true, role: 'admin', client_id: null });
      }
      return Response.json({ applied: false, role: null, client_id: null });
    }

    const invite = pending[0];
    console.log('Applying invite:', invite.intended_role, 'client_id:', invite.client_id);

    // Update user with app_role and client_id via service role
    const updateData = { app_role: invite.intended_role };
    if (invite.client_id) {
      updateData.client_id = invite.client_id;
    }
    await base44.asServiceRole.entities.User.update(user.id, updateData);

    // Mark invite as applied
    await base44.asServiceRole.entities.PendingInvite.update(invite.id, { status: 'applied' });

    // Auto-link Employee record if one exists with matching email
    try {
      const matchingEmployees = await base44.asServiceRole.entities.Employee.filter({
        email: user.email.toLowerCase(),
      }, '-created_date', 10);

      const unlinkable = matchingEmployees.find(e => !e.user_id);
      if (unlinkable) {
        await base44.asServiceRole.entities.Employee.update(unlinkable.id, { user_id: user.id });
        console.log('Auto-linked Employee', unlinkable.id, 'to User', user.id);
      }
    } catch (linkErr) {
      console.error('Employee auto-link failed (non-fatal):', linkErr.message);
    }

    console.log('Successfully applied role:', invite.intended_role);

    return Response.json({
      applied: true,
      role: invite.intended_role,
      client_id: invite.client_id || null,
    });
  } catch (error) {
    console.error('applyPendingRole error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});