import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Percent } from 'lucide-react';

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color.includes('text-') ? '' : 'text-white'}`} style={
        typeof value === 'string' && value.startsWith('-') ? { color: '#ef4444' } :
        typeof value === 'string' && label.includes('Profit') && !value.startsWith('-') ? { color: '#22c55e' } :
        {}
      }>
        {value}
      </p>
    </div>
  );
}

export default function ProfitabilityKPIs({ summary }) {
  if (!summary) return null;

  const fmt = (v) => {
    if (v == null) return '$0';
    const abs = Math.abs(v);
    const str = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
    return v < 0 ? `-${str}` : str;
  };

  const profitColor = summary.totalNetProfit >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10';
  const marginColor = summary.avgMargin == null ? 'text-slate-400 bg-slate-700/50' :
    summary.avgMargin >= 20 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard label="Total Revenue" value={fmt(summary.totalRevenue)} icon={DollarSign} color="text-[#D6FF03] bg-[#D6FF03]/10" />
      <KPICard label="Total Costs" value={fmt(summary.totalCosts)} icon={TrendingDown} color="text-orange-400 bg-orange-500/10" />
      <KPICard label="Total Net Profit" value={fmt(summary.totalNetProfit)} icon={TrendingUp} color={profitColor} />
      <KPICard label="Average Margin" value={summary.avgMargin != null ? `${summary.avgMargin.toFixed(1)}%` : 'N/A'} icon={Percent} color={marginColor} />
    </div>
  );
}