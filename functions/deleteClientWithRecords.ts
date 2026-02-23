import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entity, filter, sort = '-created_date', limit = 200) {
  const results = [];
  let skip = 0;
  while (true) {
    const batch = await entity.filter(filter, sort, limit, skip);
    results.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return results;
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

    const { clientId, action } = await req.json();
    // action = "preview" | "delete_all" | "delete_client_only"

    if (!clientId) {
      return Response.json({ error: 'clientId is required' }, { status: 400 });
    }

    const filter = { client_id: clientId };

    if (action === 'preview') {
      // Count associated records using server-side filters
      const [leads, expenses, billings, spend, onboardProjects] = await Promise.all([
        fetchAll(base44.asServiceRole.entities.Lead, filter),
        fetchAll(base44.asServiceRole.entities.Expense, filter),
        fetchAll(base44.asServiceRole.entities.MonthlyBilling, filter),
        fetchAll(base44.asServiceRole.entities.Spend, filter),
        fetchAll(base44.asServiceRole.entities.OnboardProject, filter),
      ]);

      return Response.json({
        counts: {
          leads: leads.length,
          expenses: expenses.length,
          billings: billings.length,
          spend: spend.length,
          onboard_projects: onboardProjects.length,
        },
        total: leads.length + expenses.length + billings.length + spend.length + onboardProjects.length,
      });
    }

    if (action === 'delete_all') {
      // Fetch all associated records
      const [leads, expenses, billings, spend, onboardProjects] = await Promise.all([
        fetchAll(base44.asServiceRole.entities.Lead, filter),
        fetchAll(base44.asServiceRole.entities.Expense, filter),
        fetchAll(base44.asServiceRole.entities.MonthlyBilling, filter),
        fetchAll(base44.asServiceRole.entities.Spend, filter),
        fetchAll(base44.asServiceRole.entities.OnboardProject, filter),
      ]);

      // Fetch onboard tasks for those projects
      let onboardTasks = [];
      for (const proj of onboardProjects) {
        const tasks = await fetchAll(base44.asServiceRole.entities.OnboardTask, { project_id: proj.id });
        onboardTasks.push(...tasks);
      }

      // Delete all in parallel batches
      const allDeletes = [
        ...leads.map(r => base44.asServiceRole.entities.Lead.delete(r.id)),
        ...expenses.map(r => base44.asServiceRole.entities.Expense.delete(r.id)),
        ...billings.map(r => base44.asServiceRole.entities.MonthlyBilling.delete(r.id)),
        ...spend.map(r => base44.asServiceRole.entities.Spend.delete(r.id)),
        ...onboardTasks.map(r => base44.asServiceRole.entities.OnboardTask.delete(r.id)),
        ...onboardProjects.map(r => base44.asServiceRole.entities.OnboardProject.delete(r.id)),
      ];

      // Process in chunks of 20 to avoid overwhelming the API
      const CHUNK = 20;
      for (let i = 0; i < allDeletes.length; i += CHUNK) {
        await Promise.all(allDeletes.slice(i, i + CHUNK));
      }

      // Finally delete the client itself
      await base44.asServiceRole.entities.Client.delete(clientId);

      const totalDeleted = leads.length + expenses.length + billings.length + spend.length + onboardTasks.length + onboardProjects.length;
      return Response.json({ success: true, deleted: totalDeleted + 1 });
    }

    if (action === 'delete_client_only') {
      await base44.asServiceRole.entities.Client.delete(clientId);
      return Response.json({ success: true, deleted: 1 });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});