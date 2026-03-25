import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.app_role !== 'admin' && user.app_role !== 'finance_admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { targetMonth, action } = await req.json();
    if (!targetMonth || !action) {
      return Response.json({ error: 'targetMonth and action (close|open) are required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    const existing = await sr.CompanySettings.filter({ key: 'closed_month', value: targetMonth }, '-created_date', 10);

    if (action === 'close') {
      if (existing.length > 0) {
        return Response.json({ success: true, action: 'already_closed', targetMonth });
      }
      await sr.CompanySettings.create({ key: 'closed_month', value: targetMonth });
      return Response.json({ success: true, action: 'closed', targetMonth });
    }

    if (action === 'open') {
      for (const record of existing) {
        await sr.CompanySettings.delete(record.id);
      }
      return Response.json({ success: true, action: 'opened', targetMonth });
    }

    return Response.json({ error: 'action must be close or open' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});