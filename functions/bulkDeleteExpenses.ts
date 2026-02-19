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

    let deleted = 0;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < ids.length; i++) {
      try {
        await base44.asServiceRole.entities.Expense.delete(ids[i]);
        deleted++;
      } catch (e) {
        if (e.message?.includes('Rate limit')) {
          await delay(2000);
          await base44.asServiceRole.entities.Expense.delete(ids[i]);
          deleted++;
        } else if (!e.message?.includes('not found')) {
          throw e;
        }
      }
      if ((i + 1) % 3 === 0) await delay(500);
    }

    return Response.json({ success: true, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});