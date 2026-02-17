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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <card.icon className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500 uppercase">{card.label}</p>
          </div>
          <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}