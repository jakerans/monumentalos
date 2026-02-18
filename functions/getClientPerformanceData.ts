import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [clients, leads, spend, payments] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.list('-created_date', 5000),
      base44.asServiceRole.entities.Spend.list('-date', 5000),
      base44.asServiceRole.entities.Payment.list('-date', 5000),
    ]);

    return Response.json({ clients, leads, spend, payments });
  } catch (error) {
    console.error('getClientPerformanceData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});