import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'admin' && user.app_role !== 'onboard_admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { selectedMonth } = await req.json();
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(selYear, selMonth - 1, 1).toISOString();
    const monthEnd = new Date(selYear, selMonth, 0, 23, 59, 59).toISOString();

    const [clients, billingRecords, leads] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.MonthlyBilling.filter({ billing_month: selectedMonth }),
      // Only fetch leads relevant to this billing month (showed or booked within the month)
      base44.asServiceRole.entities.Lead.filter(
        {
          $or: [
            { appointment_date: { $gte: monthStart, $lte: monthEnd } },
            { date_appointment_set: { $gte: monthStart, $lte: monthEnd } }
          ]
        },
        '-created_date',
        5000
      ),
    ]);

    return Response.json({ clients, billingRecords, leads });
  } catch (error) {
    console.error('getMonthlyBillingData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});