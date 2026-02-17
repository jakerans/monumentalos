import React from 'react';
import { DollarSign, Users, CalendarCheck, Eye, Trophy, TrendingUp, Clock, Target } from 'lucide-react';

function KPICard({ label, value, subtitle, icon: Icon, color, alert, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800/50 rounded-lg border p-3 transition-all ${alert ? 'border-red-500/30 bg-red-500/10' : 'border-slate-700/50'} ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-600' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1 rounded ${color || 'bg-slate-700'}`}>
          <Icon className="w-3.5 h-3.5 text-current" />
        </div>
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
      </div>
      <p className={`text-lg font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function ClientKPIGrid({ metrics, onCardClick }) {
  const {
    totalSpend, totalLeads, apptsBooked, apptsShowed, apptsCancelled,
    jobsSold, totalRevenue, cpa, cpl, showRate, closeRate, stl,
    dqCount, conversionRate
  } = metrics;

  const click = (key) => onCardClick ? () => onCardClick(key) : undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <KPICard label="Ad Spend" value={`$${totalSpend.toLocaleString()}`} icon={DollarSign} color="bg-purple-100 text-purple-600" onClick={click('spend')} />
      <KPICard label="Total Leads" value={totalLeads} icon={Users} color="bg-blue-100 text-blue-600" subtitle={dqCount > 0 ? `${dqCount} disqualified` : undefined} onClick={click('leads')} />
      <KPICard label="Cost Per Lead" value={cpl === Infinity || isNaN(cpl) ? '—' : `$${cpl.toFixed(0)}`} icon={Target} color="bg-indigo-100 text-indigo-600" />
      <KPICard label="Appts Booked" value={apptsBooked} icon={CalendarCheck} color="bg-green-100 text-green-600" onClick={click('booked')} />
      <KPICard
        label="Cost Per Appt"
        value={cpa === Infinity || isNaN(cpa) ? '—' : `$${cpa.toFixed(0)}`}
        icon={DollarSign}
        color="bg-amber-100 text-amber-600"
        alert={cpa > 300 && apptsBooked > 0}
        subtitle={cpa > 300 && apptsBooked > 0 ? 'High CPA' : undefined}
      />
      <KPICard label="Showed" value={apptsShowed} icon={Eye} color="bg-teal-100 text-teal-600" subtitle={`${showRate}% show rate`} onClick={click('showed')} />
      <KPICard label="Cancelled" value={apptsCancelled} icon={CalendarCheck} color="bg-red-100 text-red-600" onClick={click('cancelled')} />
      <KPICard label="Avg STL" value={stl === null ? '—' : `${stl.toFixed(0)} min`} icon={Clock} color="bg-cyan-100 text-cyan-600" alert={stl !== null && stl > 15} subtitle={stl !== null && stl > 15 ? 'Slow response' : undefined} />
      <KPICard label="Jobs Sold" value={jobsSold} icon={Trophy} color="bg-emerald-100 text-emerald-600" subtitle={`${closeRate}% close rate`} onClick={click('sold')} />
      <KPICard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-green-100 text-green-700" subtitle={`${conversionRate}% lead→sold`} onClick={click('sold')} />
    </div>
  );
}