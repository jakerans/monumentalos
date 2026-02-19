import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entity) {
  const results = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    const batch = await entity.filter({}, '-date', limit, skip);
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

    // Find all expenses that have AI suggestions (suggested_category set)
    const all = await fetchAll(base44.entities.Expense);
    const withSuggestions = all.filter(e => e.suggested_category && e.suggested_category !== '');

    if (withSuggestions.length === 0) {
      return Response.json({ message: 'No AI suggestions to undo', reverted: 0 });
    }

    // Clear suggested_category, suggested_type, and set ai_approved to false
    const results = await Promise.allSettled(
      withSuggestions.map(e =>
        base44.asServiceRole.entities.Expense.update(e.id, {
          suggested_category: '',
          suggested_type: '',
          ai_approved: false,
        })
      )
    );

    const reverted = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[undoAICategorize] Reverted ${reverted}/${withSuggestions.length} expenses`);

    return Response.json({ success: true, reverted, total: withSuggestions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});