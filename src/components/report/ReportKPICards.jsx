import React from 'react';
import { DollarSign, CalendarCheck, Eye, Trophy, TrendingUp, Target, ArrowUp, ArrowDown, Percent, Activity } from 'lucide-react';

function ChangeIndicator({ current, prior, invertGood = false }) {
  if (prior === 0 || prior == null) {
    return <span className="text-[10px] font-medium text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">New</span>;
  }
  const pctChange = ((current - prior) / prior) * 100;
  const isUp = pctChange > 0;
  const isGood = invertGood ? !isUp : isUp;
  if (Math.abs(pctChange) < 0.5) return null;

  const Icon = isUp ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${isGood ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
      <Icon className="w-2.5 h-2.5" />
      {Math.abs(pctChange).toFixed(1)}%
    </span>
  );
}

export default function ReportKPICards({
  totalSpend, appointmentsBooked, appointmentsShowed, jobsSold, totalRevenue,
  showRate, costPerAppointment, roi,
  priorTotalSpend, priorAppointmentsBooked, priorAppointmentsShowed, priorJobsSold, priorTotalRevenue,
  priorShowRate, priorCostPerAppointment, priorRoi,
}) {
  const cards = [
    { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, accent: 'text-red-400', iconBg: 'bg-red-500/15', current: totalSpend, prior: priorTotalSpend, invertGood: true },
    { label: 'Cost / Appt', value: costPerAppointment === Infinity || isNaN(costPerAppointment) ? '—' : `$${costPerAppointment.toFixed(0)}`, icon: Target, accent: 'text-orange-400', iconBg: 'bg-orange-500/15', current: costPerAppointment, prior: priorCostPerAppointment, invertGood: true },
    { label: 'Appts Booked', value: appointmentsBooked, icon: CalendarCheck, accent: 'text-blue-400', iconBg: 'bg-blue-500/15', current: appointmentsBooked, prior: priorAppointmentsBooked },
    { label: 'Show Rate', value: `${showRate}%`, icon: Percent, accent: 'text-indigo-400', iconBg: 'bg-indigo-500/15', current: parseFloat(showRate), prior: parseFloat(priorShowRate) },
    { label: 'Appts Showed', value: appointmentsShowed, icon: Eye, accent: 'text-purple-400', iconBg: 'bg-purple-500/15', current: appointmentsShowed, prior: priorAppointmentsShowed },
    { label: 'Jobs Sold', value: jobsSold, icon: Trophy, accent: 'text-amber-400', iconBg: 'bg-amber-500/15', current: jobsSold, prior: priorJobsSold },
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, accent: 'text-emerald-400', iconBg: 'bg-emerald-500/15', current: totalRevenue, prior: priorTotalRevenue },
    { label: 'ROI', value: roi, icon: Activity, accent: 'text-cyan-400', iconBg: 'bg-cyan-500/15', current: parseFloat(roi) || 0, prior: parseFloat(priorRoi) || 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-slate-800/60 backdrop-blur rounded-xl p-3 sm:p-4 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`${card.iconBg} rounded-lg p-1.5 sm:p-2`}>
              <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.accent}`} />
            </div>
            <ChangeIndicator current={card.current} prior={card.prior} invertGood={card.invertGood} />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-white leading-none mb-0.5">{card.value}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  );
}