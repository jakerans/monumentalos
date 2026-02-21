import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Percent } from 'lucide-react';

function KPICard({ label, value, icon: Icon, iconColor, valueClass }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
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

  const profitValueClass = summary.totalNetProfit >= 0 ? 'text-green-400' : 'text-red-400';
  const profitIconColor = summary.totalNetProfit >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10';

  const marginValueClass = summary.avgMargin == null ? 'text-white' :
    summary.avgMargin >= 20 ? 'text-green-400' :
    summary.avgMargin >= 0 ? 'text-yellow-400' : 'text-red-400';
  const marginIconColor = summary.avgMargin == null ? 'text-slate-400 bg-slate-700/50' :
    summary.avgMargin >= 20 ? 'text-green-400 bg-green-500/10' :
    summary.avgMargin >= 0 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard label="Total Revenue" value={fmt(summary.totalRevenue)} icon={DollarSign} iconColor="text-[#D6FF03] bg-[#D6FF03]/10" valueClass="text-white" />
      <KPICard label="Total Costs" value={fmt(summary.totalCosts)} icon={TrendingDown} iconColor="text-orange-400 bg-orange-500/10" valueClass="text-white" />
      <KPICard label="Total Net Profit" value={fmt(summary.totalNetProfit)} icon={TrendingUp} iconColor={profitIconColor} valueClass={profitValueClass} />
      <KPICard label="Average Margin" value={summary.avgMargin != null ? `${summary.avgMargin.toFixed(1)}%` : 'N/A'} icon={Percent} iconColor={marginIconColor} valueClass={marginValueClass} />
    </div>
  );
}