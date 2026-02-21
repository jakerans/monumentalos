import React from 'react';
import { XCircle, Target, Ruler, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

function ChangeIndicator({ current, prior, invertGood = false }) {
  const cur = parseFloat(current) || 0;
  const pri = parseFloat(prior) || 0;
  if (pri === 0) {
    return <span className="text-[10px] font-medium text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">New</span>;
  }
  const pctChange = ((cur - pri) / pri) * 100;
  if (Math.abs(pctChange) < 0.5) return null;
  const isUp = pctChange > 0;
  const isGood = invertGood ? !isUp : isUp;
  const Icon = isUp ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${isGood ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
      <Icon className="w-2.5 h-2.5" />
      {Math.abs(pctChange).toFixed(1)}%
    </span>
  );
}

export default function ReportCalculations({
  cancellationRate, winRate, avgJobSize, costOfMarketing, totalSpend, totalRevenue,
  priorCancellationRate, priorWinRate, priorAvgJobSize, priorCostOfMarketing,
}) {
  const cards = [
    {
      label: 'Cancellation Rate',
      value: `${cancellationRate}%`,
      icon: XCircle,
      subtitle: 'Cancelled / Total Appointments',
      current: cancellationRate,
      prior: priorCancellationRate,
      invertGood: true,
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: Target,
      subtitle: 'Sold / Showed',
      current: winRate,
      prior: priorWinRate,
    },
    {
      label: 'Avg Job Size',
      value: `$${parseInt(avgJobSize).toLocaleString()}`,
      icon: Ruler,
      subtitle: 'Revenue / Jobs Sold',
      current: avgJobSize,
      prior: priorAvgJobSize,
    },
    {
      label: 'Cost of Marketing',
      value: `${costOfMarketing}%`,
      icon: BarChart3,
      subtitle: `$${totalSpend.toLocaleString()} / $${totalRevenue.toLocaleString()}`,
      current: costOfMarketing,
      prior: priorCostOfMarketing,
      invertGood: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-slate-800/60 backdrop-blur rounded-xl p-3 sm:p-4 border border-slate-700/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <card.icon className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase leading-tight">{card.label}</p>
            </div>
            <ChangeIndicator current={card.current} prior={card.prior} invertGood={card.invertGood} />
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{card.value}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}