import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    // Get all active performance pay plans
    const activePlans = await sr.PerformancePay.filter({ status: 'active' });

    // Determine the period label for last month
    const now = new Date();
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodLabel = `${lmStart.getFullYear()}-${String(lmStart.getMonth() + 1).padStart(2, '0')}`;

    // For quarterly plans, only reset on Jan, Apr, Jul, Oct
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const isQuarterStart = [1, 4, 7, 10].includes(currentMonth);
    const quarterLabel = (() => {
      const qMonth = lmStart.getMonth() + 1;
      const q = Math.ceil(qMonth / 3);
      return `${lmStart.getFullYear()}-Q${q}`;
    })();

    let snapshotCount = 0;
    let resetCount = 0;

    for (const plan of activePlans) {
      const isMonthly = plan.frequency === 'monthly';
      const isQuarterly = plan.frequency === 'quarterly';

      // Skip quarterly plans unless it's the start of a quarter
      if (isQuarterly && !isQuarterStart) continue;

      const progress = plan.current_period_progress || 0;
      const payout = plan.current_period_payout || 0;
      const label = isQuarterly ? quarterLabel : periodLabel;

      // Check if we already created a record for this period
      const existing = await sr.PerformancePayRecord.filter({
        performance_pay_id: plan.id,
        period: label,
      });

      if (existing.length > 0) continue; // Already snapshotted

      // Determine tier reached
      let tierReached = null;
      if (plan.tiers && plan.tiers.length > 0) {
        const sorted = [...plan.tiers].sort((a, b) => a.threshold - b.threshold);
        for (const tier of sorted) {
          if (progress >= tier.threshold) tierReached = tier.label;
        }
      }

      // Create the historical record
      await sr.PerformancePayRecord.create({
        performance_pay_id: plan.id,
        employee_id: plan.employee_id,
        period: label,
        metric_value: progress,
        payout: payout,
        tier_reached: tierReached || 'None',
        status: 'calculated',
      });
      snapshotCount++;

      // Reset current period progress and payout to 0
      await sr.PerformancePay.update(plan.id, {
        current_period_progress: 0,
        current_period_payout: 0,
      });
      resetCount++;
    }

    return Response.json({
      success: true,
      snapshotCount,
      resetCount,
      message: `Snapshotted ${snapshotCount} plans, reset ${resetCount} plans for new period.`,
    });
  } catch (error) {
    console.error('resetPerformancePay error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});