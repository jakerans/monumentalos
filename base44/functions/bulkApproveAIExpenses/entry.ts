import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const allowed = ['admin', 'finance_admin'];
    if (!allowed.includes(user.app_role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const all = [];
    let skip = 0;
    const limit = 200;
    while (true) {
      const batch = await base44.asServiceRole.entities.Expense.filter({}, '-date', limit, skip);
      all.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
    }

    const pending = all.filter(e =>
      e.category && e.category !== 'uncategorized' &&
      e.suggested_category &&
      e.ai_approved === false
    );

    if (pending.length === 0) {
      return Response.json({ message: 'Nothing to approve', approved: 0 });
    }

    let approved = 0;
    for (const e of pending) {
      await base44.asServiceRole.entities.Expense.update(e.id, {
        ai_approved: true,
        suggested_category: '',
        suggested_type: '',
      });
      approved++;
      if (approved % 5 === 0) await sleep(300);
    }

    return Response.json({ success: true, approved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});