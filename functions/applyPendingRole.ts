import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { event, data } = payload;
    
    if (!data || !data.email) {
      return Response.json({ message: 'No user data' }, { status: 200 });
    }

    const email = data.email.toLowerCase();

    // Find pending invite for this email
    const pendingInvites = await base44.asServiceRole.entities.PendingInvite.filter({
      email: email,
      status: 'pending'
    });

    if (pendingInvites.length === 0) {
      return Response.json({ message: 'No pending invite found' }, { status: 200 });
    }

    const invite = pendingInvites[0];
    const updateData = { role: invite.intended_role };
    
    if (invite.client_id) {
      updateData.client_id = invite.client_id;
    }

    // Apply the role to the new user
    await base44.asServiceRole.entities.User.update(data.id, updateData);

    // Mark invite as applied
    await base44.asServiceRole.entities.PendingInvite.update(invite.id, { status: 'applied' });

    return Response.json({ message: `Role ${invite.intended_role} applied to ${email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});