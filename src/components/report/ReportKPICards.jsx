import React from 'react';
import { DollarSign, CalendarCheck, Eye, Trophy, TrendingUp } from 'lucide-react';

export default function ReportKPICards({ totalSpend, appointmentsBooked, appointmentsShowed, jobsSold, totalRevenue }) {
  const cards = [
    { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'Appointments Booked', value: appointmentsBooked, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Appointments Showed', value: appointmentsShowed, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Jobs Sold', value: jobsSold, icon: Trophy, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-lg p-3 sm:p-5 border ${card.border}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
            <p className="text-[10px] sm:text-xs font-medium text-gray-600 leading-tight">{card.label}</p>
          </div>
          <p className={`text-lg sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}