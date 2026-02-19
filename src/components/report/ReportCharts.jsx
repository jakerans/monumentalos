import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b'];

const FancyTooltip = ({ active, payload, label }) => {
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
          <span className="text-[11px] font-bold text-white">{typeof entry.value === 'number' && (entry.name?.includes('Spend') || entry.name?.includes('Revenue') || entry.name?.includes('$')) ? `$${entry.value.toLocaleString()}` : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const FancyLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-5 mt-2">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
        <span className="text-[10px] font-medium text-slate-400">{entry.value}</span>
      </div>
    ))}
  </div>
);

const FancyPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload?.fill || d.color }} />
        <span className="text-[11px] font-semibold text-white">{d.name}</span>
      </div>
      <p className="text-[11px] font-bold text-slate-300 mt-1">{d.value}</p>
    </div>
  );
};

export default function ReportCharts({ spendRecords, bookedLeads, appointmentLeads, soldLeads }) {
  // Monthly summary bar chart
  const monthlyData = useMemo(() => {
    const months = {};

    spendRecords.forEach(s => {
      const key = s.date?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].spend += s.amount || 0;
    });

    bookedLeads.forEach(l => {
      const key = l.date_appointment_set?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].booked += 1;
    });

    appointmentLeads.forEach(l => {
      if (l.disposition !== 'showed') return;
      const key = l.appointment_date?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].showed += 1;
    });

    soldLeads.filter(l => l.outcome === 'sold').forEach(l => {
      const key = l.date_sold?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].sold += 1;
      months[key].revenue += l.sale_amount || 0;
    });

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
      ...m,
      month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }));
  }, [spendRecords, bookedLeads, appointmentLeads, soldLeads]);

  // Disposition pie chart
  const dispositionData = useMemo(() => {
    const counts = { showed: 0, cancelled: 0, scheduled: 0, rescheduled: 0 };
    appointmentLeads.forEach(l => {
      const d = l.disposition || 'scheduled';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [appointmentLeads]);

  // Outcome pie chart
  const outcomeData = useMemo(() => {
    const counts = { sold: 0, lost: 0, pending: 0 };
    appointmentLeads.forEach(l => {
      if (l.disposition !== 'showed') return;
      const o = l.outcome || 'pending';
      counts[o] = (counts[o] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [appointmentLeads]);

  const PIE_COLORS_DISP = { Showed: '#22c55e', Cancelled: '#ef4444', Scheduled: '#3b82f6', Rescheduled: '#a855f7' };
  const PIE_COLORS_OUT = { Sold: '#22c55e', Lost: '#ef4444', Pending: '#f59e0b' };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Monthly overview bar chart */}
      <div className="bg-slate-800/50 rounded-xl shadow border border-slate-700/50 p-3 sm:p-6">
        <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-4">Monthly Overview</h3>
        {monthlyData.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No data available for the selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="rcBookedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="rcShowedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="rcSoldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FancyTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
              <Legend content={<FancyLegend />} />
              <Bar dataKey="booked" name="Booked" fill="url(#rcBookedGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="showed" name="Showed" fill="url(#rcShowedGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sold" name="Sold" fill="url(#rcSoldGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spend & Revenue chart */}
      <div className="bg-slate-800/50 rounded-xl shadow border border-slate-700/50 p-3 sm:p-6">
        <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-4">Spend vs Revenue</h3>
        {monthlyData.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No data available for the selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="rcSpendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="rcRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v.toLocaleString()}`} axisLine={false} tickLine={false} />
              <Tooltip content={<FancyTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
              <Legend content={<FancyLegend />} />
              <Bar dataKey="spend" name="Spend" fill="url(#rcSpendGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue" fill="url(#rcRevGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-slate-800/50 rounded-xl shadow border border-slate-700/50 p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-4">Appointment Disposition</h3>
          {dispositionData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dispositionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} cornerRadius={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11} stroke="none">
                  {dispositionData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS_DISP[entry.name] || '#94a3b8'} style={{ filter: `drop-shadow(0 0 4px ${PIE_COLORS_DISP[entry.name] || '#94a3b8'}66)` }} />
                  ))}
                </Pie>
                <Legend content={<FancyLegend />} />
                <Tooltip content={<FancyPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl shadow border border-slate-700/50 p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-4">Outcome Breakdown</h3>
          {outcomeData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} cornerRadius={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11} stroke="none">
                  {outcomeData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS_OUT[entry.name] || '#94a3b8'} style={{ filter: `drop-shadow(0 0 4px ${PIE_COLORS_OUT[entry.name] || '#94a3b8'}66)` }} />
                  ))}
                </Pie>
                <Legend content={<FancyLegend />} />
                <Tooltip content={<FancyPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}