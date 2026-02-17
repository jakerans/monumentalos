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
      return Response.json({ applied: false, role: null, client_id: null });
    }

    const invite = pending[0];

    // Mark invite as applied
    await base44.asServiceRole.entities.PendingInvite.update(invite.id, { status: 'applied' });

    // Return the role info so the frontend can apply it via auth.updateMe()
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