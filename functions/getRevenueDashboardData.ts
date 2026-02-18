import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAllFiltered(entityRef, filter, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.filter(filter, sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

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
    const sr = base44.asServiceRole.entities;

    const [clients, leads, payments, expenses] = await Promise.all([
      sr.Client.list(),
      fetchAllFiltered(sr.Lead, { created_date: { $gte: revFetchStart } }, '-created_date'),
      fetchAllFiltered(sr.Payment, { date: { $gte: revFetchStart } }, '-date'),
      fetchAllFiltered(sr.Expense, { date: { $gte: revFetchStart } }, '-date'),
    ]);

    return Response.json({ clients, leads, payments, expenses });
  } catch (error) {
    console.error('getRevenueDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});