import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

async function updateWithRetry(entity, id, data) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await entity.update(id, data);
      return;
    } catch (err) {
      if ((err.message?.includes('Rate limit') || err.message?.includes('429')) && attempt < 4) {
        await sleep(2000 * Math.pow(2, attempt));
        continue;
      }
      throw err;
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Server-side filter: only expenses with a non-empty suggested_category
    const withSuggestions = await fetchAllFiltered(
      base44.entities.Expense,
      { suggested_category: { $ne: '' } },
      '-date'
    );

    // Also grab ones where suggested_category is a real value (not null/empty)
    // The $ne filter should handle this, but let's also double-check in memory
    const toRevert = withSuggestions.filter(e => e.suggested_category && e.suggested_category.trim() !== '');

    if (toRevert.length === 0) {
      return Response.json({ message: 'No AI suggestions to undo', reverted: 0 });
    }

    const clearData = { suggested_category: '', suggested_type: '', ai_approved: false };
    let reverted = 0;

    // Process one at a time with 500ms delay to stay under rate limits
    for (const e of toRevert) {
      await updateWithRetry(base44.asServiceRole.entities.Expense, e.id, clearData);
      reverted++;
      await sleep(500);
    }

    return Response.json({ success: true, reverted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});