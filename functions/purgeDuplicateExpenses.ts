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
      if (idsToDelete.length === 0) {
        return Response.json({ deleted: 0 });
      }
      // Delete individually with small delays to avoid rate limits
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      let deleted = 0;
      for (const id of idsToDelete) {
        try {
          await base44.asServiceRole.entities.Expense.delete(id);
          deleted++;
        } catch (e) {
          // skip not-found
        }
        if (deleted % 5 === 0) await delay(300);
      }
      return Response.json({ deleted });
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