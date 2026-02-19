import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Area, AreaChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from 'lucide-react';

const CashFlowTooltip = ({ active, payload, label }) => {
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

const CashFlowLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-5 mt-2">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
        <span className="text-[10px] font-medium text-slate-400">{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function CashFlowAnalysis({ payments, expenses }) {
  // Compute MTD distributions for the summary card
  const distSummary = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dists = expenses.filter(e => e.expense_type === 'distribution');
    const mtd = dists.filter(e => e.date && new Date(e.date) >= thisMonthStart).reduce((s, e) => s + (e.amount || 0), 0);
    const total = dists.reduce((s, e) => s + (e.amount || 0), 0);
    return { mtd, total };
  }, [expenses]);

  const { monthlyData, summary } = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short', year: '2-digit' }) });
    }

    let cumulative = 0;
    const monthlyData = months.map(m => {
      const mStart = new Date(m.year, m.month, 1);
      const mEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59);
      const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= mStart && dt <= mEnd; };

      const inflows = payments.filter(p => inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
      const outflows = expenses.filter(e => inRange(e.date) && e.expense_type !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
      const net = inflows - outflows;
      cumulative += net;

      return { name: m.label, Inflows: Math.round(inflows), Outflows: Math.round(outflows), 'Net Cash Flow': Math.round(net), 'Cumulative': Math.round(cumulative) };
    });

    const currentMonth = monthlyData[monthlyData.length - 1] || {};
    const prevMonth = monthlyData[monthlyData.length - 2] || {};
    const totalInflows = monthlyData.reduce((s, m) => s + m.Inflows, 0);
    const totalOutflows = monthlyData.reduce((s, m) => s + m.Outflows, 0);
    const avgMonthlyNet = monthlyData.length > 0 ? Math.round(monthlyData.reduce((s, m) => s + m['Net Cash Flow'], 0) / monthlyData.length) : 0;
    const burnRate = totalOutflows > 0 ? Math.round(totalOutflows / monthlyData.length) : 0;

    return {
      monthlyData,
      summary: {
        currentNet: currentMonth['Net Cash Flow'] || 0,
        prevNet: prevMonth['Net Cash Flow'] || 0,
        cumulative: currentMonth.Cumulative || 0,
        avgMonthlyNet,
        burnRate,
        totalInflows,
        totalOutflows,
      }
    };
  }, [payments, expenses]);

  const netChange = summary.prevNet !== 0
    ? (((summary.currentNet - summary.prevNet) / Math.abs(summary.prevNet)) * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Net Cash (This Month)</p>
            <div className={`p-1 rounded ${summary.currentNet >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {summary.currentNet >= 0
                ? <ArrowUpRight className="w-3 h-3 text-green-400" />
                : <ArrowDownRight className="w-3 h-3 text-red-400" />}
            </div>
          </div>
          <p className={`text-lg font-bold ${summary.currentNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${Math.abs(summary.currentNet).toLocaleString()}
          </p>
          {netChange !== null && (
            <p className={`text-[10px] mt-0.5 ${Number(netChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(netChange) >= 0 ? '+' : ''}{netChange}% vs last month
            </p>
          )}
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Cumulative (6 Mo)</p>
            <div className={`p-1 rounded ${summary.cumulative >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Wallet className={`w-3 h-3 ${summary.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
          </div>
          <p className={`text-lg font-bold ${summary.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${Math.abs(summary.cumulative).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Avg Monthly Net</p>
            <div className={`p-1 rounded ${summary.avgMonthlyNet >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
              <TrendingUp className={`w-3 h-3 ${summary.avgMonthlyNet >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
          </div>
          <p className={`text-lg font-bold ${summary.avgMonthlyNet >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ${Math.abs(summary.avgMonthlyNet).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Avg Monthly Burn</p>
            <div className="p-1 rounded bg-orange-500/10">
              <ArrowDownRight className="w-3 h-3 text-orange-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-orange-400">${summary.burnRate.toLocaleString()}</p>
        </div>
      </div>

      {/* Distributions summary */}
      <div className="bg-slate-800/50 rounded-lg border border-emerald-700/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-medium text-slate-400 uppercase mb-1">Owner Distributions (Not in P&L)</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-slate-500">This Month</p>
                <p className="text-lg font-bold text-emerald-400">${distSummary.mtd.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <p className="text-[10px] text-slate-500">All Time</p>
                <p className="text-lg font-bold text-emerald-400">${distSummary.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inflows vs Outflows */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Inflows vs Outflows</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyData}>
              <defs>
                <linearGradient id="cfInflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="cfOutflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.55} />
                </linearGradient>
                <filter id="cfNetGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CashFlowTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
              <Legend content={<CashFlowLegend />} />
              <Bar dataKey="Inflows" fill="url(#cfInflowGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Outflows" fill="url(#cfOutflowGrad)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Net Cash Flow" stroke="#D6FF03" strokeWidth={2.5} dot={{ r: 4, fill: '#D6FF03', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} filter="url(#cfNetGlow)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative cash position */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Cumulative Cash Position</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="cfCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CashFlowTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="Cumulative" stroke="#10b981" strokeWidth={2.5} fill="url(#cfCumulativeGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}