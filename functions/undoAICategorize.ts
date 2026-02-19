import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAllFiltered(entity, filter, sort) {
  const results = [];
  let skip = 0;
  const limit = 200;
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
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Server-side filter: only fetch expenses that actually have AI suggestions
    const withSuggestions = await fetchAllFiltered(
      base44.entities.Expense,
      { suggested_category: { $ne: '' } },
      '-date'
    );

    if (withSuggestions.length === 0) {
      return Response.json({ message: 'No AI suggestions to undo', reverted: 0 });
    }

    // Clear suggestions in parallel
    await Promise.all(
      withSuggestions.map(e =>
        base44.asServiceRole.entities.Expense.update(e.id, {
          suggested_category: '',
          suggested_type: '',
          ai_approved: false,
        })
      )
    );

    return Response.json({ success: true, reverted: withSuggestions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});