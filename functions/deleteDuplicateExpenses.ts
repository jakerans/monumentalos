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

    // Attempt single-call deleteMany with $in operator
    try {
      const result = await base44.asServiceRole.entities.Expense.deleteMany({ id: { $in: ids } });
      const deleted = result?.deleted || ids.length;
      console.log(`[deleteDuplicateExpenses] deleteMany removed ${deleted} duplicates in one call`);
      return Response.json({ success: true, deleted });
    } catch (e) {
      console.log(`[deleteDuplicateExpenses] deleteMany failed (${e.message}), falling back to parallel batches`);
      // Fallback: parallel batches of 50
      let deleted = 0;
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const results = await Promise.allSettled(
          batch.map(id => base44.asServiceRole.entities.Expense.delete(id))
        );
        deleted += results.filter(r => r.status === 'fulfilled').length;
      }
      console.log(`[deleteDuplicateExpenses] Fallback deleted ${deleted}/${ids.length}`);
      return Response.json({ success: true, deleted });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});