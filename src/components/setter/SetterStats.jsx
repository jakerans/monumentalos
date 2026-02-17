import React from 'react';
import { Phone, Clock, Calendar, CheckCircle } from 'lucide-react';

export default function SetterStats({ newCount, inProgressCount, bookedCount, todayCount }) {
  const stats = [
    { label: 'New', count: newCount, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'In Progress', count: inProgressCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Booked', count: bookedCount, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: "Today's Appts", count: todayCount, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {stats.map((s) => (
        <div key={s.label} className={`${s.bg} rounded-lg p-3 sm:p-4 border ${s.border}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
            <p className={`text-[10px] sm:text-xs font-medium ${s.color}`}>{s.label}</p>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.count}</p>
        </div>
      ))}
    </div>
  );
}