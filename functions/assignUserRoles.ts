import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assignments } = await req.json();
    // assignments: [{ user_id, app_role, client_id? }]

    const results = [];
    for (const a of assignments) {
      const updateData = { app_role: a.app_role };
      if (a.client_id) {
        updateData.client_id = a.client_id;
      }
      await base44.asServiceRole.entities.User.update(a.user_id, updateData);
      results.push({ user_id: a.user_id, app_role: a.app_role, success: true });
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});