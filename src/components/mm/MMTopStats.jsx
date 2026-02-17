import React from 'react';
import { Users, CalendarCheck, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function MMTopStats({ stats }) {
  const pd = stats.periodDays || 7;
  const cpaDisplay = stats.avgCPA === Infinity || isNaN(stats.avgCPA) || stats.avgCPA === 0 ? '—' : `$${stats.avgCPA.toFixed(0)}`;
  const cpaChange = stats.cpaChange;

  const items = [
    { label: 'Active Clients', value: stats.activeClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: `Appts Set (${pd}d)`, value: stats.apptsSet, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: `Ad Spend (${pd}d)`, value: `$${stats.spend.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: `Avg CPA (${pd}d)`, value: cpaDisplay, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', cpaChange },
    { label: 'Avg STL (min)', value: stats.avgSTL === null ? '—' : stats.avgSTL.toFixed(0), icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Alerts', value: stats.alertCount, icon: AlertTriangle, color: stats.alertCount > 0 ? 'text-red-600' : 'text-gray-400', bg: stats.alertCount > 0 ? 'bg-red-50' : 'bg-gray-50' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`p-1 rounded ${item.bg}`}>
              <item.icon className={`w-3 h-3 ${item.color}`} />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">{item.label}</span>
          </div>
          <p className={`text-lg sm:text-xl font-bold ${item.color === 'text-red-600' && item.label === 'Alerts' ? 'text-red-600' : 'text-gray-900'}`}>{item.value}</p>
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