import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entityRef, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.list(sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

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
    if (user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // Default to 90 days back if no dates provided
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 90);
    const startDate = body.startDate || defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate || now.toISOString().split('T')[0];

    const sr = base44.asServiceRole.entities;

    // Calculate prior period (same duration, immediately before)
    const startMs = new Date(startDate + 'T00:00:00.000Z').getTime();
    const endMs = new Date(endDate + 'T23:59:59.999Z').getTime();
    const durationMs = endMs - startMs;
    const priorStart = new Date(startMs - durationMs).toISOString().split('T')[0];
    const priorEnd = new Date(startMs - 1).toISOString().split('T')[0];

    const [clients, leads, users] = await Promise.all([
      fetchAll(sr.Client, '-created_date'),
      fetchAll(sr.Lead, '-created_date'),
      sr.User.list(),
    ]);

    return Response.json({ clients, leads, users, priorStart, priorEnd });
  } catch (error) {
    console.error('getSetterPerformanceData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});