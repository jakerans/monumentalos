import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await base44.asServiceRole.entities.QuickLink.filter({ is_active: true }, 'order', 100);
    return Response.json({ links: links.sort((a, b) => (a.order || 0) - (b.order || 0)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});