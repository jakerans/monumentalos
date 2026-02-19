import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'scan'; // 'scan' or 'purge'
    const idsToDelete = body.ids || [];

    if (mode === 'purge') {
      // Step 2: Just delete the provided IDs
      if (idsToDelete.length === 0) {
        return Response.json({ deleted: 0 });
      }
      let totalDeleted = 0;
      const CHUNK = 500;
      for (let i = 0; i < idsToDelete.length; i += CHUNK) {
        const chunk = idsToDelete.slice(i, i + CHUNK);
        const result = await base44.asServiceRole.entities.Expense.deleteMany({ id: { $in: chunk } });
        totalDeleted += result?.deleted || chunk.length;
      }
      return Response.json({ deleted: totalDeleted });
    }

    // mode === 'scan': Fetch and find duplicates
    const all = [];
    let skip = 0;
    const limit = 100;
    while (true) {
      const batch = await base44.entities.Expense.filter({}, '-date', limit, skip);
      all.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
    }

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

    return Response.json({
      totalScanned: all.length,
      duplicateCount: duplicateIds.length,
      duplicateAmount: Math.round(duplicateAmount * 100) / 100,
      duplicateIds,
    });
  } catch (error) {
    console.error('purgeDuplicateExpenses error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});