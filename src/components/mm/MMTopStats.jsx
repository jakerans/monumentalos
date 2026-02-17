import React from 'react';
import { Users, CalendarCheck, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ scale: 1.04, y: -2 }}
          className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-2.5 sm:p-3 hover:border-slate-600/50 hover:bg-slate-800/70 transition-colors duration-200"
        >
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
        </motion.div>
      ))}
    </div>
  );
}