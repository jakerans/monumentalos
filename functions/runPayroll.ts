import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { payrollDate, includePrevPerfPay } = await req.json();
    if (!payrollDate) {
      return Response.json({ error: 'payrollDate is required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    const [employees, perfPlans, perfRecords, companySettings] = await Promise.all([
      sr.Employee.filter({ status: 'active' }, '-created_date', 5000),
      sr.PerformancePay.filter({ status: 'active' }, '-created_date', 5000),
      sr.PerformancePayRecord.list('-created_date', 5000),
      sr.CompanySettings.filter({ key: 'payroll' }, '-created_date', 1),
    ]);

    const payrollSettings = companySettings[0] || {};
    const freq = payrollSettings.payroll_frequency || 'biweekly';
    const cyclesPerYear = freq === 'weekly' ? 52 : freq === 'biweekly' ? 26 : freq === 'semi_monthly' ? 24 : 12;

    // Determine previous month string
    const pd = new Date(payrollDate + 'T00:00:00');
    const prevMonth = new Date(pd.getFullYear(), pd.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const expensesToCreate = [];
    const perfRecordUpdates = []; // { id, data }

    for (const emp of employees) {
      // --- Base Pay ---
      let perCyclePay = 0;
      if (emp.classification === 'salary' && emp.pay_per_cycle > 0) {
        perCyclePay = emp.pay_per_cycle;
      } else if (emp.classification === 'contractor' && emp.contractor_billing_type === 'per_cycle' && emp.pay_per_cycle > 0) {
        perCyclePay = emp.pay_per_cycle;
      }

      if (perCyclePay > 0) {
        expensesToCreate.push({
          category: 'payroll',
          expense_type: emp.cost_type || 'overhead',
          description: `${emp.full_name} - Base Payroll ${payrollDate}`,
          amount: perCyclePay,
          date: payrollDate,
          recurring: false,
          vendor: emp.full_name,
          ai_approved: true,
        });
      }

      // --- Performance Pay (previous month) ---
      if (includePrevPerfPay && emp.has_performance_pay) {
        const empPlans = perfPlans.filter(p => p.employee_id === emp.id);

        for (const plan of empPlans) {
          // Find the previous month record
          const prevRecord = perfRecords.find(r =>
            r.performance_pay_id === plan.id && r.period === prevMonthStr
          );

          if (prevRecord && prevRecord.status !== 'paid' && (prevRecord.payout || 0) > 0) {
            expensesToCreate.push({
              category: 'payroll',
              expense_type: emp.cost_type || 'overhead',
              description: `${emp.full_name} - Perf Pay ${prevMonthStr}`,
              amount: prevRecord.payout,
              date: payrollDate,
              recurring: false,
              vendor: emp.full_name,
              ai_approved: true,
            });

            perfRecordUpdates.push({ id: prevRecord.id, data: { status: 'paid' } });
          }
        }
      }
    }

    // Bulk create expenses
    let createdCount = 0;
    if (expensesToCreate.length > 0) {
      // Create in batches of 50
      for (let i = 0; i < expensesToCreate.length; i += 50) {
        const batch = expensesToCreate.slice(i, i + 50);
        await sr.Expense.bulkCreate(batch);
        createdCount += batch.length;
      }
    }

    // Update performance pay records to 'paid'
    for (const update of perfRecordUpdates) {
      await sr.PerformancePayRecord.update(update.id, update.data);
    }

    return Response.json({
      success: true,
      expensesCreated: createdCount,
      perfRecordsMarkedPaid: perfRecordUpdates.length,
      summary: expensesToCreate.map(e => ({ description: e.description, amount: e.amount, type: e.expense_type })),
    });
  } catch (error) {
    console.error('runPayroll error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});