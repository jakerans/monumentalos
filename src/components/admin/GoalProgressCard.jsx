import React from 'react';

export default function GoalProgressCard({ label, current, goal, format = 'dollar', color = 'blue' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isPercent = format === 'percent';

  const formatVal = (v) => {
    if (isPercent) return `${v.toFixed(1)}%`;
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const colors = {
    blue: { bar: 'bg-blue-500', bg: 'bg-slate-700', text: 'text-blue-400' },
    emerald: { bar: 'bg-emerald-500', bg: 'bg-slate-700', text: 'text-emerald-400' },
    purple: { bar: 'bg-purple-500', bg: 'bg-slate-700', text: 'text-purple-400' },
    indigo: { bar: 'bg-indigo-500', bg: 'bg-slate-700', text: 'text-indigo-400' },
    green: { bar: 'bg-green-500', bg: 'bg-slate-700', text: 'text-green-400' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <span className={`text-[10px] font-bold ${c.text}`}>{pct.toFixed(0)}%</span>
      </div>
      <p className="text-xl font-bold text-white mb-2">{formatVal(current)}</p>
      <div className={`w-full h-2 rounded-full ${c.bg}`}>
        <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 mt-1">Goal: {formatVal(goal)}</p>
    </div>
  );
}