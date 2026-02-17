import React from 'react';
import { DollarSign, CalendarCheck, Eye, Trophy, TrendingUp } from 'lucide-react';

export default function ReportKPICards({ totalSpend, appointmentsBooked, appointmentsShowed, jobsSold, totalRevenue }) {
  const cards = [
    { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Appointments Booked', value: appointmentsBooked, icon: CalendarCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Appointments Showed', value: appointmentsShowed, icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Jobs Sold', value: jobsSold, icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-lg p-3 sm:p-5 border ${card.border}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 leading-tight">{card.label}</p>
          </div>
          <p className={`text-lg sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}