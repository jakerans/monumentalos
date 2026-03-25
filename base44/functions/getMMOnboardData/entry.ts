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

    const sr = base44.asServiceRole.entities;

    const [activeProjects, allTasks, allProjectsFull] = await Promise.all([
      fetchAllFiltered(sr.OnboardProject, { status: 'in_progress' }, '-created_date'),
      fetchAll(sr.OnboardTask, '-created_date'),
      fetchAll(sr.OnboardProject, '-created_date'),
    ]);

    return Response.json({ activeProjects, allTasks, allProjectsFull });
  } catch (error) {
    console.error('getMMOnboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});