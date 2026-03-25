import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.app_role !== 'admin' && user.app_role !== 'finance_admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { weekStart, weekEnd } = await req.json();
    if (!weekStart || !weekEnd) {
      return Response.json({ error: 'weekStart and weekEnd are required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    // Fetch all billing records
    const allBilling = await (async () => {
      const results = [];
      let skip = 0;
      while (true) {
        const batch = await sr.MonthlyBilling.filter({}, '-billing_month', 5000, skip);
        results.push(...batch);
        if (batch.length < 5000) break;
        skip += 5000;
      }
      return results;
    })();

    // Fetch all clients for name lookup
    const clients = await sr.Client.list();
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c.name; });

    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);
    const weekEndDate = new Date(weekEnd);
    weekEndDate.setHours(23, 59, 59, 999);

    const inWeek = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= weekStartDate && d <= weekEndDate;
    };

    // Collected this week = paid records with paid_date in range
    const collectedRecords = allBilling.filter(b => b.status === 'paid' && inWeek(b.paid_date));
    const collectedTotal = collectedRecords.reduce((s, b) => s + (b.paid_amount || b.calculated_amount || b.manual_amount || 0), 0);

    // Failed/problem accounts = all records currently marked failed or overdue (current state, not week-filtered)
    const problemRecords = allBilling.filter(b => b.status === 'failed' || b.status === 'overdue');
    const problemTotal = problemRecords.reduce((s, b) => s + (b.manual_amount || b.calculated_amount || 0), 0);

    // Total AR = all unpaid across all time
    const totalAR = allBilling
      .filter(b => b.status !== 'paid')
      .reduce((s, b) => s + (b.manual_amount || b.calculated_amount || 0), 0);

    // Enrich problem records with client names
    const problemList = problemRecords.map(b => ({
      id: b.id,
      clientName: clientMap[b.client_id] || 'Unknown Client',
      amount: b.manual_amount || b.calculated_amount || 0,
      status: b.status,
      notes: b.notes || '',
      billing_month: b.billing_month,
    }));

    return Response.json({
      weekStart,
      weekEnd,
      collectedTotal: Math.round(collectedTotal * 100) / 100,
      collectedCount: collectedRecords.length,
      problemTotal: Math.round(problemTotal * 100) / 100,
      problemCount: problemRecords.length,
      problemList,
      totalAR: Math.round(totalAR * 100) / 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});