import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { mode, payrollDate, includePrevPerfPay, lineItems } = body;

    if (!payrollDate) {
      return Response.json({ error: 'payrollDate is required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    // ─── PREVIEW MODE: build line items from employee data ───
    if (mode === 'preview') {
      const [employees, perfPlans, perfRecords, companySettings] = await Promise.all([
        sr.Employee.filter({ status: 'active' }, '-created_date', 5000),
        sr.PerformancePay.filter({ status: 'active' }, '-created_date', 5000),
        sr.PerformancePayRecord.list('-created_date', 5000),
        sr.CompanySettings.filter({ key: 'payroll' }, '-created_date', 1),
      ]);

      const payrollSettings = companySettings[0] || {};
      const freq = payrollSettings.payroll_frequency || 'biweekly';
      const cyclesPerYear = freq === 'weekly' ? 52 : freq === 'biweekly' ? 26 : freq === 'semi_monthly' ? 24 : 12;

      const pd = new Date(payrollDate + 'T00:00:00');
      const prevMonth = new Date(pd.getFullYear(), pd.getMonth() - 1, 1);
      const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

      const items = [];

      for (const emp of employees) {
        let perCyclePay = 0;
        if (emp.classification === 'salary' && emp.pay_per_cycle > 0) {
          perCyclePay = emp.pay_per_cycle;
        } else if (emp.classification === 'contractor' && emp.contractor_billing_type === 'per_cycle' && emp.pay_per_cycle > 0) {
          perCyclePay = emp.pay_per_cycle;
        }

        if (perCyclePay > 0) {
          items.push({
            id: `base_${emp.id}`,
            type: 'base_pay',
            employee_name: emp.full_name,
            description: `${emp.full_name} - Base Payroll`,
            amount: perCyclePay,
            expense_type: emp.cost_type || 'overhead',
            category: 'payroll',
            editable: true,
          });
        }

        if (includePrevPerfPay && emp.has_performance_pay) {
          const empPlans = perfPlans.filter(p => p.employee_id === emp.id);
          for (const plan of empPlans) {
            const prevRecord = perfRecords.find(r =>
              r.performance_pay_id === plan.id && r.period === prevMonthStr
            );
            if (prevRecord && prevRecord.status !== 'paid' && (prevRecord.payout || 0) > 0) {
              items.push({
                id: `perf_${prevRecord.id}`,
                type: 'perf_pay',
                employee_name: emp.full_name,
                description: `${emp.full_name} - Perf Pay ${prevMonthStr}`,
                amount: prevRecord.payout,
                expense_type: emp.cost_type || 'overhead',
                category: 'payroll',
                perf_record_id: prevRecord.id,
                editable: true,
              });
            }
          }
        }
      }

      return Response.json({ success: true, mode: 'preview', items });
    }

    // ─── RUN MODE: create expenses from confirmed line items ───
    if (mode === 'run') {
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return Response.json({ error: 'No line items provided' }, { status: 400 });
      }

      const expensesToCreate = [];
      const perfRecordIds = [];

      for (const item of lineItems) {
        if (!item.amount || item.amount <= 0) continue;

        expensesToCreate.push({
          category: item.category || 'payroll',
          expense_type: item.expense_type || 'overhead',
          description: item.description || 'Payroll item',
          amount: parseFloat(item.amount),
          date: payrollDate,
          recurring: false,
          vendor: item.employee_name || item.vendor || '',
          ai_approved: true,
        });

        if (item.perf_record_id) {
          perfRecordIds.push(item.perf_record_id);
        }
      }

      let createdCount = 0;
      for (let i = 0; i < expensesToCreate.length; i += 50) {
        const batch = expensesToCreate.slice(i, i + 50);
        await sr.Expense.bulkCreate(batch);
        createdCount += batch.length;
      }

      for (const prId of perfRecordIds) {
        await sr.PerformancePayRecord.update(prId, { status: 'paid' });
      }

      return Response.json({
        success: true,
        mode: 'run',
        expensesCreated: createdCount,
        perfRecordsMarkedPaid: perfRecordIds.length,
        summary: expensesToCreate.map(e => ({ description: e.description, amount: e.amount, type: e.expense_type })),
      });
    }

    // ─── UNDO MODE: delete payroll expenses for a given date ───
    if (mode === 'undo') {
      const expenses = await sr.Expense.filter({ date: payrollDate, category: 'payroll' }, '-created_date', 5000);

      if (expenses.length === 0) {
        return Response.json({ success: true, mode: 'undo', deletedCount: 0, perfRecordsReverted: 0 });
      }

      // Find any perf pay records that were marked paid on that date and revert them
      const perfRecords = await sr.PerformancePayRecord.filter({ status: 'paid' }, '-created_date', 5000);
      let perfReverted = 0;

      // Check expense descriptions for perf pay pattern to identify which records to revert
      const perfExpenseDescs = expenses
        .filter(e => e.description && e.description.includes('Perf Pay'))
        .map(e => e.description);

      for (const pr of perfRecords) {
        // If any expense description references this period, revert the record
        const matchDesc = `Perf Pay ${pr.period}`;
        if (perfExpenseDescs.some(d => d.includes(matchDesc))) {
          await sr.PerformancePayRecord.update(pr.id, { status: 'calculated' });
          perfReverted++;
        }
      }

      // Delete the expenses
      for (const exp of expenses) {
        await sr.Expense.delete(exp.id);
      }

      return Response.json({
        success: true,
        mode: 'undo',
        deletedCount: expenses.length,
        perfRecordsReverted: perfReverted,
      });
    }

    return Response.json({ error: 'Invalid mode. Use "preview", "run", or "undo".' }, { status: 400 });
  } catch (error) {
    console.error('runPayroll error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});