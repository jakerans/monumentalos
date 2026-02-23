import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'No ids provided' }, { status: 400 });
    }

    console.log(`[deleteDuplicateExpenses] Deleting ${ids.length} duplicates`);

    // Delete all at once using parallel individual deletes in one shot
    const results = await Promise.allSettled(
      ids.map(id => base44.asServiceRole.entities.Expense.delete(id))
    );

    const deleted = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[deleteDuplicateExpenses] Done: ${deleted} deleted, ${failed} failed`);
    return Response.json({ success: true, deleted, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});