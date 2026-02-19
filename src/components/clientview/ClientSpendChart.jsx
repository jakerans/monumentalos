import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';

const SpendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl shadow-black/50">
      <p className="text-[11px] font-semibold text-slate-300 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-6 py-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-[11px] text-slate-400">{entry.name}</span>
          </div>
          <span className="text-[11px] font-bold text-white">{entry.name?.includes('$') || entry.name?.includes('Spend') || entry.name?.includes('CPA') ? `$${(entry.value || 0).toLocaleString()}` : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SpendLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-5 mt-2">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
        <span className="text-[10px] font-medium text-slate-400">{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function ClientSpendChart({ spendRecords, leads }) {
  const chartData = useMemo(() => {
    // Group by week
    const weeks = {};

    spendRecords.forEach(s => {
      const d = new Date(s.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { week: key, spend: 0, leads: 0, appts: 0 };
      weeks[key].spend += s.amount || 0;
    });

    leads.forEach(l => {
      const d = new Date(l.created_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { week: key, spend: 0, leads: 0, appts: 0 };
      weeks[key].leads += 1;
      if (l.appointment_date) weeks[key].appts += 1;
    });

    return Object.values(weeks)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map(w => ({
        ...w,
        weekLabel: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cpa: w.appts > 0 ? Math.round(w.spend / w.appts) : null,
      }));
  }, [spendRecords, leads]);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <h3 className="text-sm font-bold text-white mb-2">Weekly Performance</h3>
        <p className="text-xs text-slate-500 text-center py-8">No data for selected period</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <h3 className="text-sm font-bold text-white mb-4">Weekly Performance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="csSpendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="csLeadsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="csApptsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
            </linearGradient>
            <filter id="csCpaGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<SpendTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
          <Legend content={<SpendLegend />} />
          <Bar yAxisId="left" dataKey="spend" name="Spend ($)" fill="url(#csSpendGrad)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="leads" name="Leads" fill="url(#csLeadsGrad)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="appts" name="Appts" fill="url(#csApptsGrad)" radius={[4, 4, 0, 0]} />
          <Line yAxisId="left" dataKey="cpa" name="CPA ($)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} connectNulls filter="url(#csCpaGlow)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}