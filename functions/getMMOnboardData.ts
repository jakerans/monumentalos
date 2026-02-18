import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [activeProjects, allTasks, allProjectsFull] = await Promise.all([
      base44.asServiceRole.entities.OnboardProject.filter({ status: 'in_progress' }),
      base44.asServiceRole.entities.OnboardTask.list('-created_date', 1000),
      base44.asServiceRole.entities.OnboardProject.list('-created_date', 200),
    ]);

    return Response.json({ activeProjects, allTasks, allProjectsFull });
  } catch (error) {
    console.error('getMMOnboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});