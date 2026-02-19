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
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 1: Find all duplicates (same logic as findDuplicateExpenses)
    const all = await fetchAll(base44.asServiceRole.entities.Expense);

    const groups = {};
    for (const e of all) {
      const desc = (e.description || '').trim().toLowerCase();
      if (!desc) continue;
      const key = `${e.date}|${desc}|${e.amount}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }

    const duplicateIds = [];
    let duplicateAmount = 0;
    for (const items of Object.values(groups)) {
      if (items.length > 1) {
        items.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        const dupes = items.slice(1);
        for (const d of dupes) {
          duplicateIds.push(d.id);
          duplicateAmount += d.amount || 0;
        }
      }
    }

    if (duplicateIds.length === 0) {
      return Response.json({ deleted: 0, totalScanned: all.length, duplicateAmount: 0 });
    }

    // Step 2: Delete in chunks of 500 using deleteMany
    const CHUNK = 500;
    let totalDeleted = 0;
    for (let i = 0; i < duplicateIds.length; i += CHUNK) {
      const chunk = duplicateIds.slice(i, i + CHUNK);
      const result = await base44.asServiceRole.entities.Expense.deleteMany({ id: { $in: chunk } });
      totalDeleted += result?.deleted || chunk.length;
    }

    return Response.json({
      deleted: totalDeleted,
      totalScanned: all.length,
      duplicateAmount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});