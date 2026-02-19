import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Area, AreaChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from 'lucide-react';

export default function CashFlowAnalysis({ payments, expenses }) {
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
      const outflows = expenses.filter(e => inRange(e.date)).reduce((s, e) => s + (e.amount || 0), 0);
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inflows vs Outflows */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <h3 className="text-sm font-bold text-white mb-3">Inflows vs Outflows (6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={v => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Inflows" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Outflows" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="Net Cash Flow" stroke="#D6FF03" strokeWidth={2} dot={{ r: 3, fill: '#D6FF03' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative cash position */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <h3 className="text-sm font-bold text-white mb-3">Cumulative Cash Position (6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={v => `$${v.toLocaleString()}`} />
              <defs>
                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="Cumulative" stroke="#10b981" strokeWidth={2} fill="url(#cumulativeGrad)" dot={{ r: 3, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}