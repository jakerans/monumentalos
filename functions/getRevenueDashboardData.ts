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

    const { revFetchStart } = await req.json();

    const [clients, leads, payments, expenses] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.filter(
        { created_date: { $gte: revFetchStart } },
        '-created_date',
        5000
      ),
      base44.asServiceRole.entities.Payment.filter(
        { date: { $gte: revFetchStart } },
        '-date',
        5000
      ),
      base44.asServiceRole.entities.Expense.filter(
        { date: { $gte: revFetchStart } },
        '-date',
        5000
      ),
    ]);

    return Response.json({ clients, leads, payments, expenses });
  } catch (error) {
    console.error('getRevenueDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});