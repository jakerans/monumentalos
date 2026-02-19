import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 1: Fetch all expenses in small pages
    const all = [];
    let skip = 0;
    const limit = 100;
    while (true) {
      const batch = await base44.asServiceRole.entities.Expense.filter({}, '-date', limit, skip);
      all.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
    }

    // Step 2: Group by date+description+amount to find duplicates
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

    // Step 3: Delete using deleteMany in chunks of 500
    let totalDeleted = 0;
    const CHUNK = 500;
    for (let i = 0; i < duplicateIds.length; i += CHUNK) {
      const chunk = duplicateIds.slice(i, i + CHUNK);
      const result = await base44.asServiceRole.entities.Expense.deleteMany({ id: { $in: chunk } });
      totalDeleted += result?.deleted || chunk.length;
    }

    return Response.json({
      deleted: totalDeleted,
      totalScanned: all.length,
      duplicateAmount: Math.round(duplicateAmount * 100) / 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});