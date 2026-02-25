import React from 'react';
import { Calendar, Target, Timer, Ban, TrendingUp, Users } from 'lucide-react';

function KPICard({ label, value, subtitle, icon: Icon, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-slate-700/30`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function SetterStatsKPIs({ setterCount, totalLeadsGenerated, totalBooked, totalShowed, totalDQ, avgSTL, bookingRate, showRate }) {
  const stlColor = avgSTL != null && avgSTL <= 5 ? 'text-green-400' : avgSTL != null && avgSTL <= 15 ? 'text-amber-400' : 'text-blue-400';
  const stlBg = avgSTL != null && avgSTL <= 5 ? 'bg-green-500/10' : avgSTL != null && avgSTL <= 15 ? 'bg-amber-500/10' : 'bg-blue-500/10';

  const cards = [
    { label: 'Active Setters', value: setterCount, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Total Leads', value: totalLeadsGenerated, icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Bookings', value: totalBooked, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Showings', value: totalShowed, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'DQ\'d Leads', value: totalDQ, icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Avg STL', value: avgSTL != null ? `${avgSTL}m` : '—', icon: Timer, color: stlColor, bg: stlBg },
    { label: 'Booking Rate', value: bookingRate != null ? `${bookingRate}%` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Show Rate', value: showRate != null ? `${showRate}%` : '—', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map(c => <KPICard key={c.label} {...c} />)}
    </div>
  );
}