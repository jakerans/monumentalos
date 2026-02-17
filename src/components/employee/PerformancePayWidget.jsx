import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

function getMonthlyBasePay(emp) {
  if (emp.classification === 'salary') return emp.salary_monthly || 0;
  if (emp.classification === 'hourly') return (emp.hourly_rate || 0) * (emp.standard_monthly_hours || 0);
  if (emp.classification === 'contractor') {
    if (emp.contractor_billing_type === 'monthly') return emp.contractor_rate || 0;
    if (emp.contractor_billing_type === 'hourly') return (emp.contractor_rate || 0) * 160;
  }
  return 0;
}

function getCurrentTier(plan) {
  if (!plan.tiers || plan.tiers.length === 0) return null;
  const progress = plan.current_period_progress || 0;
  let currentTier = null;
  for (const tier of [...plan.tiers].sort((a, b) => a.threshold - b.threshold)) {
    if (progress >= tier.threshold) currentTier = tier;
  }
  return currentTier;
}

function getNextTier(plan) {
  const progress = plan.current_period_progress || 0;
  const sorted = [...(plan.tiers || [])].sort((a, b) => a.threshold - b.threshold);
  return sorted.find(t => t.threshold > progress) || null;
}

export default function PerformancePayWidget({ employees, perfPlans, onSelectPlan }) {
  const activePlans = perfPlans.filter(p => p.status === 'active');
  const empsWithPlans = employees.filter(e => e.has_performance_pay && e.status === 'active');

  if (empsWithPlans.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 text-center">
        <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No employees on performance pay yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-white">Performance Pay</h3>
      </div>
      <div className="divide-y divide-slate-700/30">
        {empsWithPlans.map(emp => {
          const empPlans = activePlans.filter(p => p.employee_id === emp.id);
          const basePay = getMonthlyBasePay(emp);
          const totalPerfPay = empPlans.reduce((s, p) => s + (p.current_period_payout || 0), 0);
          const totalPay = basePay + totalPerfPay;

          return (
            <div key={emp.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">{emp.full_name}</p>
                <p className="text-sm font-bold" style={{ color: '#D6FF03' }}>
                  ${totalPay.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-2">
                <span>Base: ${basePay.toLocaleString()}</span>
                <span>+</span>
                <span className="text-purple-400">Perf: ${totalPerfPay.toLocaleString()}</span>
              </div>
              {empPlans.map(plan => {
                const currentTier = getCurrentTier(plan);
                const nextTier = getNextTier(plan);
                const progress = plan.current_period_progress || 0;
                const maxThreshold = plan.tiers?.length ? Math.max(...plan.tiers.map(t => t.threshold)) : 100;
                const pct = maxThreshold > 0 ? Math.min((progress / maxThreshold) * 100, 100) : 0;

                return (
                  <div
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className="bg-slate-900/50 rounded-lg p-3 mb-1.5 cursor-pointer hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-slate-200">{plan.name}</p>
                      <span className="text-[10px] text-slate-500 capitalize">{plan.frequency}</span>
                    </div>
                    {currentTier && (
                      <p className="text-[10px] text-purple-400 mb-1">
                        Current: {currentTier.label} ({currentTier.percentage}%)
                      </p>
                    )}
                    <div className="w-full h-1.5 bg-slate-700 rounded-full mb-1">
                      <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>${progress.toLocaleString()} progress</span>
                      {nextTier && <span>Next: {nextTier.label} @ ${nextTier.threshold.toLocaleString()}</span>}
                    </div>
                    {(plan.current_period_payout || 0) > 0 && (
                      <p className="text-[10px] font-medium text-green-400 mt-1">Payout: ${(plan.current_period_payout || 0).toLocaleString()}</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}