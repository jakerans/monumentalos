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
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const all = await fetchAll(base44.entities.Expense);

    // Group by date + description + amount (all three must match)
    // Skip expenses with no description to avoid false positives
    const groups = {};
    for (const e of all) {
      const desc = (e.description || '').trim().toLowerCase();
      if (!desc) continue;
      const key = `${e.date}|${desc}|${e.amount}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }

    // Find groups with more than one entry
    const duplicateGroups = [];
    let totalDuplicateCount = 0;
    for (const [key, items] of Object.entries(groups)) {
      if (items.length > 1) {
        // Keep the oldest one (first created), mark the rest as duplicates
        items.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        const keep = items[0];
        const dupes = items.slice(1);
        totalDuplicateCount += dupes.length;
        duplicateGroups.push({
          key,
          date: keep.date,
          amount: keep.amount,
          description: keep.description || '',
          category: keep.category,
          count: items.length,
          keepId: keep.id,
          duplicateIds: dupes.map(d => d.id),
        });
      }
    }

    // Sort by amount descending so biggest duplicates show first
    duplicateGroups.sort((a, b) => (b.amount * b.duplicateIds.length) - (a.amount * a.duplicateIds.length));

    return Response.json({
      totalExpenses: all.length,
      totalDuplicateCount,
      duplicateGroups,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});