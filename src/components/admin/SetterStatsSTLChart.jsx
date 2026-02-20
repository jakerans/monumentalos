import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{d.name}</p>
      <p className="text-slate-300">Avg STL: <span className="text-white font-bold">{d.avgSTL != null ? `${d.avgSTL}m` : '—'}</span></p>
      <p className="text-slate-300">Calls: <span className="text-white font-bold">{d.firstCalls}</span></p>
    </div>
  );
}

export default function SetterStatsSTLChart({ stats }) {
  const data = stats
    .filter(s => s.avgSTL != null)
    .sort((a, b) => a.avgSTL - b.avgSTL)
    .map(s => ({
      name: s.name.split(' ')[0],
      avgSTL: s.avgSTL,
      firstCalls: s.firstCalls,
      fill: s.avgSTL <= 5 ? '#34d399' : s.avgSTL <= 15 ? '#fbbf24' : '#f87171',
    }));

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Avg Speed to Lead by Setter</h3>
        <p className="text-slate-500 text-sm text-center py-10">No STL data for this period</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-1">Avg Speed to Lead by Setter</h3>
      <p className="text-[11px] text-slate-500 mb-3">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />≤5m
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-3 mr-1" />5-15m
        <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-3 mr-1" />&gt;15m
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} unit="m" />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={5} stroke="#34d399" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={15} stroke="#fbbf24" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Bar dataKey="avgSTL" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}