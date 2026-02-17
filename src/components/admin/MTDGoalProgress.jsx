import React from 'react';
import { Target } from 'lucide-react';

function ProgressRow({ label, current, goal, format = 'dollar' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const formatVal = (v) => format === 'percent' ? `${v.toFixed(1)}%` : `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-900">{formatVal(current)}</span>
          <span className="text-[10px] text-gray-400">/ {formatVal(goal)}</span>
          <span className={`text-[10px] font-bold ${pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full">
        <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MTDGoalProgress({ currentGoal, mtdData }) {
  if (!currentGoal) return null;

  const hasAnyGoal = currentGoal.gross_revenue_goal || currentGoal.cash_collected_goal ||
    currentGoal.gross_margin_goal || currentGoal.net_margin_goal || currentGoal.net_profit_goal;

  if (!hasAnyGoal) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-900">Monthly Goal Progress</h3>
      </div>
      <div className="space-y-3">
        {currentGoal.gross_revenue_goal > 0 && (
          <ProgressRow label="Gross Revenue" current={mtdData.grossRevenue} goal={currentGoal.gross_revenue_goal} />
        )}
        {currentGoal.cash_collected_goal > 0 && (
          <ProgressRow label="Cash Collected" current={mtdData.collected} goal={currentGoal.cash_collected_goal} />
        )}
        {currentGoal.gross_margin_goal > 0 && (
          <ProgressRow label="Gross Margin" current={mtdData.grossMargin} goal={currentGoal.gross_margin_goal} format="percent" />
        )}
        {currentGoal.net_margin_goal > 0 && (
          <ProgressRow label="Net Margin" current={mtdData.netMargin} goal={currentGoal.net_margin_goal} format="percent" />
        )}
        {currentGoal.net_profit_goal > 0 && (
          <ProgressRow label="Net Profit" current={mtdData.netProfit} goal={currentGoal.net_profit_goal} />
        )}
      </div>
    </div>
  );
}