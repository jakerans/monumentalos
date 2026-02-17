import React from 'react';
import { Users, CalendarCheck, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function MMTopStats({ stats }) {
  const pd = stats.periodLabel || '30d';
  const cpaDisplay = stats.avgCPA === Infinity || isNaN(stats.avgCPA) || stats.avgCPA === 0 ? '—' : `$${stats.avgCPA.toFixed(0)}`;
  const cpaChange = stats.cpaChange;

  const items = [
    { label: 'Active Clients', value: stats.activeClients, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: `Appts Set (${pd})`, value: stats.apptsSet, icon: CalendarCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: `Ad Spend (${pd})`, value: `$${stats.spend.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: `Avg CPA (${pd})`, value: cpaDisplay, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', cpaChange },
    { label: 'Avg STL (min)', value: stats.avgSTL === null ? '—' : stats.avgSTL.toFixed(0), icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Alerts', value: stats.alertCount, icon: AlertTriangle, color: stats.alertCount > 0 ? 'text-red-400' : 'text-slate-500', bg: stats.alertCount > 0 ? 'bg-red-500/10' : 'bg-slate-800' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`p-1 rounded ${item.bg}`}>
              <item.icon className={`w-3 h-3 ${item.color}`} />
            </div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight">{item.label}</span>
          </div>
          <p className={`text-lg sm:text-xl font-bold ${item.color === 'text-red-400' && item.label === 'Alerts' ? 'text-red-400' : 'text-white'}`}>{item.value}</p>
          {item.cpaChange != null && (
            <span className={`text-[10px] font-medium ${item.cpaChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {item.cpaChange > 0 ? '▲' : '▼'} {Math.abs(item.cpaChange).toFixed(1)}% vs prior
            </span>
          )}
        </div>
      ))}
    </div>
  );
}