import React from 'react';

export default function GoalProgressCard({ label, current, goal, format = 'dollar', color = 'blue' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isPercent = format === 'percent';

  const formatVal = (v) => {
    if (isPercent) return `${v.toFixed(1)}%`;
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const colors = {
    blue: { bar: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-700' },
    emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    purple: { bar: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-700' },
    indigo: { bar: 'bg-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    green: { bar: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <span className={`text-[10px] font-bold ${c.text}`}>{pct.toFixed(0)}%</span>
      </div>
      <p className="text-xl font-bold text-gray-900 mb-2">{formatVal(current)}</p>
      <div className={`w-full h-2 rounded-full ${c.bg}`}>
        <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Goal: {formatVal(goal)}</p>
    </div>
  );
}