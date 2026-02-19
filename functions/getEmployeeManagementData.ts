import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [employees, perfPlans, clients, companySettings, users, billingRecords] = await Promise.all([
      base44.asServiceRole.entities.Employee.list(),
      base44.asServiceRole.entities.PerformancePay.list(),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.CompanySettings.filter({ key: 'payroll' }),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.MonthlyBilling.list('-billing_month', 5000),
    ]);

    // Calculate last month's collected revenue for Revenue per FTE
    const now = new Date();
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lmStart.getFullYear()}-${String(lmStart.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthCollected = billingRecords
      .filter(b => b.billing_month === lastMonthStr && b.status === 'paid')
      .reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);

    return Response.json({
      employees,
      perfPlans,
      clients,
      payrollSettings: companySettings[0] || null,
      users,
      lastMonthCollected,
    });
  } catch (error) {
    console.error('getEmployeeManagementData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});