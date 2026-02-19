import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'No ids provided' }, { status: 400 });
    }

    // Process one at a time with delay to avoid rate limits
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    let deleted = 0;
    const errors = [];

    for (const id of ids) {
      try {
        await base44.asServiceRole.entities.Expense.delete(id);
        deleted++;
      } catch (e) {
        if (e.message?.includes('not found')) {
          // Already deleted, skip
          continue;
        }
        errors.push({ id, error: e.message });
      }
      // Wait between each delete to stay under rate limits
      await delay(200);
    }

    return Response.json({ success: true, deleted, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});