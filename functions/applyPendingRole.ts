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

    // Update non-role fields on the user (e.g. client_id)
    // The platform role was already set at invite time; we can only update custom fields here
    const updateData = {};
    if (invite.client_id) {
      updateData.client_id = invite.client_id;
    }

    // Try to set the app-level role; if the platform rejects it, that's ok —
    // the role might already be correct from the invite
    try {
      updateData.role = invite.intended_role;
      await base44.asServiceRole.entities.User.update(user.id, updateData);
    } catch (roleErr) {
      console.log('Could not update role (may already be set):', roleErr.message);
      // Still try to update non-role fields if any
      if (invite.client_id) {
        try {
          await base44.asServiceRole.entities.User.update(user.id, { client_id: invite.client_id });
        } catch (e2) {
          console.log('Could not update client_id:', e2.message);
        }
      }
    }

    await base44.asServiceRole.entities.PendingInvite.update(invite.id, { status: 'applied' });

    return Response.json({ applied: true, role: invite.intended_role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});