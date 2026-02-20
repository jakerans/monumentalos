import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Percent } from 'lucide-react';

function pct(cur, prior) {
  if (!prior) return null;
  return Math.round(((cur - prior) / Math.abs(prior)) * 100);
}

function Card({ label, value, icon: Icon, color, bgColor, change }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-lg font-bold ${color}`}>{value}</span>
        {change !== null && change !== undefined && (
          <span className={`text-[10px] font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

function fmt(v) {
  return `$${Math.abs(Math.round(v)).toLocaleString()}`;
}

export default function PLSummaryCards({ kpis }) {
  const cur = kpis?.current || {};
  const pri = kpis?.prior || {};

  const grossRevenue = cur.grossRevenue || 0;
  const collected = cur.collected || 0;
  const cogs = cur.cogs || 0;
  const overhead = cur.overhead || 0;
  const grossProfit = cur.grossProfit || 0;
  const netProfit = cur.netProfit || 0;
  const grossMargin = cur.grossMargin || 0;
  const netMargin = cur.netMargin || 0;

  const cards = [
    { label: 'Revenue', value: fmt(grossRevenue), icon: DollarSign, color: 'text-blue-400', bgColor: 'bg-blue-500/10', change: pct(grossRevenue, pri.grossRevenue) },
    { label: 'Collected', value: fmt(collected), icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', change: pct(collected, pri.collected) },
    { label: 'Total Expenses', value: fmt(cogs + overhead), icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-500/10', change: pct(cogs + overhead, (pri.cogs || 0) + (pri.overhead || 0)) },
    { label: 'Gross Profit', value: fmt(grossProfit), icon: BarChart3, color: grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400', bgColor: grossProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10', change: pct(grossProfit, pri.grossProfit) },
    { label: 'Net Profit', value: `${netProfit < 0 ? '-' : ''}${fmt(netProfit)}`, icon: DollarSign, color: netProfit >= 0 ? 'text-emerald-400' : 'text-red-400', bgColor: netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10', change: pct(netProfit, pri.netProfit) },
    { label: 'Net Margin', value: `${netMargin.toFixed(1)}%`, icon: Percent, color: 'text-purple-400', bgColor: 'bg-purple-500/10', change: pri.netMargin != null ? Math.round(netMargin - pri.netMargin) : null },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => <Card key={c.label} {...c} />)}
    </div>
  );
}