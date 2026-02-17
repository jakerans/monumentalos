import React from 'react';
import { Users, CalendarCheck, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

export default function MMTopStats({ stats }) {
  const pd = stats.periodLabel || '30d';
  const cpaDisplay = stats.avgCPA === Infinity || isNaN(stats.avgCPA) || stats.avgCPA === 0 ? '—' : `$${stats.avgCPA.toFixed(0)}`;
  const cpaChange = stats.cpaChange;

  const items = [
    { label: 'Active Clients', value: stats.activeClients, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    { label: `Appts Set (${pd})`, value: stats.apptsSet, icon: CalendarCheck, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399' },
    { label: `Ad Spend (${pd})`, value: `$${stats.spend.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc' },
    {
      label: `Avg CPA (${pd})`, value: cpaDisplay, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8',
      trend: cpaChange != null ? { value: Math.abs(cpaChange).toFixed(1), direction: cpaChange > 0 ? 'down' : 'up', label: 'vs prior' } : null,
    },
    { label: 'Avg STL (min)', value: stats.avgSTL === null ? '—' : stats.avgSTL.toFixed(0), icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', spark: '#22d3ee' },
    { label: 'Alerts', value: stats.alertCount, icon: AlertTriangle, color: stats.alertCount > 0 ? 'text-red-400' : 'text-slate-500', bg: stats.alertCount > 0 ? 'bg-red-500/10' : 'bg-slate-800', spark: '#f87171' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {items.map((item, i) => (
        <SparklineCard
          key={item.label}
          index={i}
          label={item.label}
          value={item.value}
          icon={item.icon}
          iconBg={item.bg}
          iconColor={item.color}
          sparkColor={item.spark}
          trend={item.trend}
        />
      ))}
    </div>
  );
}