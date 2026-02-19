import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Area, AreaChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Shield, Banknote, Settings2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

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

export default function CashFlowAnalysis({ cashFlowData = [] }) {
  const [bankBalance, setBankBalance] = useState(0);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [settingsId, setSettingsId] = useState(null);
  const [savingBalance, setSavingBalance] = useState(false);

  useEffect(() => {
    const load = async () => {
      const settings = await base44.entities.CompanySettings.filter({ key: 'cashflow' });
      if (settings.length > 0) {
        setBankBalance(settings[0].starting_bank_balance || 0);
        setBalanceInput(String(settings[0].starting_bank_balance || 0));
        setSettingsId(settings[0].id);
      }
    };
    load();
  }, []);

  const saveBalance = async () => {
    setSavingBalance(true);
    const val = Number(balanceInput) || 0;
    if (settingsId) {
      await base44.entities.CompanySettings.update(settingsId, { starting_bank_balance: val });
    } else {
      const created = await base44.entities.CompanySettings.create({ key: 'cashflow', starting_bank_balance: val });
      setSettingsId(created.id);
    }
    setBankBalance(val);
    setEditingBalance(false);
    setSavingBalance(false);
    toast({ title: 'Bank balance saved' });
  };

  const summary = useMemo(() => {
    const monthlyData = cashFlowData;
    const cur = monthlyData[monthlyData.length - 1] || {};
    const prev = monthlyData[monthlyData.length - 2] || {};
    const totalOpEx6 = monthlyData.reduce((s, m) => s + (m['Operating Expenses'] || 0), 0);
    const totalDist6 = monthlyData.reduce((s, m) => s + (m.Distributions || 0), 0);
    const totalOutflows6 = totalOpEx6 + totalDist6;
    const avgBurn = monthlyData.length > 0 ? Math.round(totalOutflows6 / monthlyData.length) : 0;

    const curOperatingCF = (cur.Inflows || 0) - (cur['Operating Expenses'] || 0);
    const curOwnerActivity = cur.Distributions || 0;
    const curTrueNet = curOperatingCF - curOwnerActivity;

    return {
      operatingCF: curOperatingCF,
      ownerActivity: curOwnerActivity,
      trueNet: curTrueNet,
      cumulative: cur.Cumulative || 0,
      avgBurn,
    };
  }, [cashFlowData]);

  const runway = summary.avgBurn > 0
    ? ((bankBalance + summary.cumulative) / summary.avgBurn).toFixed(1)
    : '∞';

  return (
    <div className="space-y-4">
      {/* Cash Flow Breakdown - 3 part */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Cash Flow Breakdown (This Month)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 mt-0.5"><TrendingUp className="w-4 h-4 text-blue-400" /></div>
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5">Operating Cash Flow</p>
              <p className={`text-xl font-bold ${summary.operatingCF >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {summary.operatingCF < 0 ? '-' : ''}${Math.abs(summary.operatingCF).toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5">Inflows − COGS − Overhead</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 mt-0.5"><Banknote className="w-4 h-4 text-emerald-400" /></div>
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5">Owner Distributions</p>
              <p className="text-xl font-bold text-emerald-400">${summary.ownerActivity.toLocaleString()}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">Not in P&L</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#D6FF03]/10 mt-0.5"><Wallet className="w-4 h-4 text-[#D6FF03]" /></div>
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5">True Net Cash Change</p>
              <p className={`text-xl font-bold ${summary.trueNet >= 0 ? 'text-[#D6FF03]' : 'text-red-400'}`}>
                {summary.trueNet < 0 ? '-' : ''}${Math.abs(summary.trueNet).toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5">Operating CF − Distributions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Cumulative (6 Mo)</p>
            <div className={`p-1 rounded ${summary.cumulative >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Wallet className={`w-3 h-3 ${summary.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
          </div>
          <p className={`text-lg font-bold ${summary.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.cumulative < 0 ? '-' : ''}${Math.abs(summary.cumulative).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Avg Monthly Burn</p>
            <div className="p-1 rounded bg-orange-500/10"><ArrowDownRight className="w-3 h-3 text-orange-400" /></div>
          </div>
          <p className="text-lg font-bold text-orange-400">${summary.avgBurn.toLocaleString()}</p>
          <p className="text-[9px] text-slate-600 mt-0.5">Incl. distributions</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-cyan-700/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Cash Runway</p>
            <div className="p-1 rounded bg-cyan-500/10"><Shield className="w-3 h-3 text-cyan-400" /></div>
          </div>
          <p className="text-lg font-bold text-cyan-400">{runway === '∞' ? '∞' : `${runway} mo`}</p>
          <p className="text-[9px] text-slate-600 mt-0.5">(Bank + Cumulative) ÷ Burn</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase">Starting Bank Balance</p>
            <button onClick={() => { setEditingBalance(!editingBalance); setBalanceInput(String(bankBalance)); }} className="p-1 rounded hover:bg-slate-700 transition-colors">
              <Settings2 className="w-3 h-3 text-slate-500" />
            </button>
          </div>
          {editingBalance ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-slate-400">$</span>
              <input type="number" value={balanceInput} onChange={ev => setBalanceInput(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter') saveBalance(); if (ev.key === 'Escape') setEditingBalance(false); }} autoFocus className="w-full px-1 py-0.5 text-sm font-bold bg-slate-900 border border-[#D6FF03]/50 rounded text-white outline-none" />
              <button onClick={saveBalance} disabled={savingBalance} className="p-1 rounded bg-[#D6FF03]/20 hover:bg-[#D6FF03]/30"><Save className="w-3 h-3 text-[#D6FF03]" /></button>
            </div>
          ) : (
            <p className="text-lg font-bold text-white">${bankBalance.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Inflows vs Outflows</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cashFlowData}>
              <defs>
                <linearGradient id="cfInflowGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.55} /></linearGradient>
                <linearGradient id="cfOpExGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.55} /></linearGradient>
                <linearGradient id="cfDistGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.55} /></linearGradient>
                <filter id="cfNetGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CashFlowTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
              <Legend content={<CashFlowLegend />} />
              <Bar dataKey="Inflows" fill="url(#cfInflowGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Operating Expenses" stackId="outflows" fill="url(#cfOpExGrad)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Distributions" stackId="outflows" fill="url(#cfDistGrad)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Net Cash Flow" stroke="#D6FF03" strokeWidth={2.5} dot={{ r: 4, fill: '#D6FF03', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} filter="url(#cfNetGlow)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Cumulative Cash Position</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="cfCumulativeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient>
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