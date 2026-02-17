import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for a pending invite matching this user's email
    const pending = await base44.asServiceRole.entities.PendingInvite.filter({
      email: user.email.toLowerCase(),
      status: 'pending',
    });

    if (pending.length === 0) {
      return Response.json({ applied: false, role: null });
    }

    const invite = pending[0];
    
    // Build update data - only include custom/editable fields
    // The 'role' field on User entity is a custom enum field, not the platform role
    const updateData = { role: invite.intended_role };
    if (invite.client_id) {
      updateData.client_id = invite.client_id;
    }

    console.log('Applying pending invite for', user.email, '-> role:', invite.intended_role, 'data:', JSON.stringify(updateData));

    // Use service role to update the user record
    await base44.asServiceRole.entities.User.update(user.id, updateData);
    console.log('User updated successfully');

    // Mark invite as applied
    await base44.asServiceRole.entities.PendingInvite.update(invite.id, { status: 'applied' });
    console.log('Invite marked as applied');

    return Response.json({ applied: true, role: invite.intended_role });
  } catch (error) {
    console.error('applyPendingRole error:', error.message, error.response?.data);
    return Response.json({ error: error.message }, { status: 500 });
  }
});