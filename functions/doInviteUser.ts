import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { email, role } = await req.json();

    if (!email || !role) {
      return Response.json({ error: 'email and role are required' }, { status: 400 });
    }

    await base44.asServiceRole.users.inviteUser(email.trim(), role);

    return Response.json({ success: true, email: email.trim(), role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});