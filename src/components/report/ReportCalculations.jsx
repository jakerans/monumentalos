import React from 'react';
import { XCircle, Target, Ruler, BarChart3 } from 'lucide-react';

export default function ReportCalculations({ cancellationRate, winRate, avgJobSize, costOfMarketing, totalSpend, totalRevenue }) {
  const cards = [
    {
      label: 'Cancellation Rate',
      value: `${cancellationRate}%`,
      icon: XCircle,
      color: parseFloat(cancellationRate) > 30 ? 'text-red-600' : 'text-gray-900',
      subtitle: 'Cancelled / Total Appointments',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: Target,
      color: parseFloat(winRate) >= 30 ? 'text-green-600' : 'text-gray-900',
      subtitle: 'Sold / Showed',
    },
    {
      label: 'Avg Job Size',
      value: `$${parseInt(avgJobSize).toLocaleString()}`,
      icon: Ruler,
      color: 'text-gray-900',
      subtitle: 'Revenue / Jobs Sold',
    },
    {
      label: 'Cost of Marketing',
      value: `${costOfMarketing}%`,
      icon: BarChart3,
      color: parseFloat(costOfMarketing) > 15 ? 'text-red-600' : 'text-green-600',
      subtitle: `$${totalSpend.toLocaleString()} / $${totalRevenue.toLocaleString()}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase leading-tight">{card.label}</p>
          </div>
          <p className={`text-xl sm:text-3xl font-bold text-white`}>{card.value}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}