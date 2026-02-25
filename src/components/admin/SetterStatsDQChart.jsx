import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const DQ_LABELS = {
  looking_for_work: 'Looking For Work',
  not_interested: 'Not Interested',
  wrong_invalid_number: 'Wrong/Invalid #',
  project_size: 'Project Size',
  oosa: 'OOSA',
  client_availability: 'Client Avail.',
};

const DQ_COLORS = {
  looking_for_work: '#8b5cf6',
  not_interested: '#6366f1',
  wrong_invalid_number: '#3b82f6',
  project_size: '#06b6d4',
  oosa: '#14b8a6',
  client_availability: '#64748b',
};

const DQ_REASONS = Object.keys(DQ_LABELS);

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SetterStatsDQChart({ stats, overallDQReasons }) {
  // Per-setter stacked bar
  const barData = stats.filter(s => s.dq > 0).map(s => {
    const row = { name: s.name.split(' ')[0] };
    DQ_REASONS.forEach(r => { row[r] = s.dqReasons[r] || 0; });
    return row;
  });

  // Overall pie
  const pieData = DQ_REASONS
    .map(r => ({ name: DQ_LABELS[r], value: overallDQReasons[r] || 0, key: r }))
    .filter(d => d.value > 0);

  const totalDQ = pieData.reduce((a, d) => a + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Per-setter stacked bar */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">DQ Reasons by Setter</h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              {DQ_REASONS.map((r, i) => (
                <Bar key={r} dataKey={r} name={DQ_LABELS[r]} stackId="dq" fill={DQ_COLORS[r]} radius={i === DQ_REASONS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-10">No DQ data for this period</p>
        )}
      </div>

      {/* Overall pie */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Overall DQ Reasons</h3>
        {totalDQ > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2} stroke="#1e293b">
                {pieData.map((entry, i) => <Cell key={i} fill={DQ_COLORS[entry.key] || '#64748b'} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                formatter={(val) => <span className="text-slate-300 text-[11px]">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-10">No DQ data for this period</p>
        )}
      </div>
    </div>
  );
}