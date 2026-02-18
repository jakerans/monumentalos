import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();
    if (!client_id) {
      return Response.json({ error: 'client_id is required' }, { status: 400 });
    }

    const [clients, leads, spend] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ id: client_id }),
      base44.asServiceRole.entities.Lead.filter({ client_id }, '-created_date', 2000),
      base44.asServiceRole.entities.Spend.filter({ client_id }, '-date', 2000),
    ]);

    return Response.json({
      client: clients[0] || null,
      leads,
      spend,
    });
  } catch (error) {
    console.error('getClientViewData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});