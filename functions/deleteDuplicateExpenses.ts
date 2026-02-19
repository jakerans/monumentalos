import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body; // array of expense IDs to delete

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'No ids provided' }, { status: 400 });
    }

    // Delete in parallel batches of 25 for speed without overwhelming the API
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 25) {
      const batch = ids.slice(i, i + 25);
      const results = await Promise.allSettled(
        batch.map(id => base44.asServiceRole.entities.Expense.delete(id))
      );
      deleted += results.filter(r => r.status === 'fulfilled').length;
    }

    console.log(`[deleteDuplicateExpenses] Deleted ${deleted}/${ids.length} duplicate expenses`);
    return Response.json({ success: true, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});