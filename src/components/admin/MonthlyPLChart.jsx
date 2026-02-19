import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Area, AreaChart } from 'recharts';

export default function MonthlyPLChart({ clients, leads, payments, expenses }) {
  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      });
    }

    return months.map(m => {
      const mStart = new Date(m.year, m.month, 1);
      const mEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59);
      const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= mStart && dt <= mEnd; };

      let grossRevenue = 0;
      clients.filter(c => c.status === 'active').forEach(client => {
        const bt = client.billing_type || 'pay_per_show';
        const cLeads = leads.filter(l => l.client_id === client.id);
        if (bt === 'pay_per_show') {
          grossRevenue += cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
        } else if (bt === 'pay_per_set') {
          grossRevenue += cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
        } else if (bt === 'retainer') {
          grossRevenue += (client.retainer_amount || 0);
        }
      });

      const collected = payments.filter(p => inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
      const mExpenses = expenses.filter(e => inRange(e.date) && e.category !== 'distribution');
      const cogs = mExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const overhead = mExpenses.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const grossProfit = grossRevenue - cogs;
      const netProfit = collected - cogs - overhead;

      return { name: m.label, Revenue: Math.round(grossRevenue), Collected: Math.round(collected), COGS: Math.round(cogs), Overhead: Math.round(overhead), 'Gross Profit': Math.round(grossProfit), 'Net Profit': Math.round(netProfit) };
    });
  }, [clients, leads, payments, expenses]);

  const CustomTooltip = ({ active, payload, label }) => {
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
            <span className="text-[11px] font-bold text-white">${(entry.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const CustomLegend = ({ payload }) => (
    <div className="flex items-center justify-center gap-5 mt-2">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[10px] font-medium text-slate-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-bold text-white mb-4">Revenue & Collections</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend content={<CustomLegend />} />
            <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={2.5} fill="url(#collGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-bold text-white mb-4">Profit & Expenses</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="ohGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="COGS" stackId="expenses" fill="url(#cogsGrad)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Overhead" stackId="expenses" fill="url(#ohGrad)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="Gross Profit" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, fill: '#a78bfa', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} filter="url(#glow)" />
            <Line type="monotone" dataKey="Net Profit" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4, fill: '#34d399', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} filter="url(#glow)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}