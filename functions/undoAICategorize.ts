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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function updateWithRetry(entity, id, data, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await entity.update(id, data);
      return true;
    } catch (err) {
      if (err.message?.includes('Rate limit') && attempt < maxRetries) {
        await sleep(1000 * (attempt + 1));
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

    // Server-side filter: only fetch expenses that actually have AI suggestions
    const withSuggestions = await fetchAllFiltered(
      base44.entities.Expense,
      { suggested_category: { $ne: '' } },
      '-date'
    );

    if (withSuggestions.length === 0) {
      return Response.json({ message: 'No AI suggestions to undo', reverted: 0 });
    }

    const clearData = { suggested_category: '', suggested_type: '', ai_approved: false };
    let reverted = 0;

    // Process sequentially with delay between each to avoid rate limits
    for (const e of withSuggestions) {
      await updateWithRetry(base44.asServiceRole.entities.Expense, e.id, clearData);
      reverted++;
      // Small delay between updates
      if (reverted % 3 === 0) await sleep(300);
    }

    return Response.json({ success: true, reverted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});