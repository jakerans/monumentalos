import React from 'react';
import { Users, CalendarCheck, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function MMTopStats({ stats }) {
  const items = [
    { label: 'Active Clients', value: stats.activeClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Appts Set (7d)', value: stats.apptsSet7d, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ad Spend (7d)', value: `$${stats.spend7d.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg CPA (7d)', value: stats.avgCPA7d === Infinity || isNaN(stats.avgCPA7d) ? '—' : `$${stats.avgCPA7d.toFixed(0)}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
        </div>
      ))}
    </div>
  );
}