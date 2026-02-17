import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon: Icon, iconColor, label, thisMonth, lastMonth, format = 'number' }) {
  const formatValue = (val) => {
    if (format === 'currency') return `$${val.toLocaleString()}`;
    return val.toLocaleString();
  };

  const pctChange = lastMonth === 0
    ? (thisMonth > 0 ? 100 : 0)
    : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const isUp = pctChange > 0;
  const isDown = pctChange < 0;
  const isFlat = pctChange === 0;

  return (
    <div className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconColor}`} />
        <p className="text-[10px] sm:text-sm font-medium text-slate-400 leading-tight">{label}</p>
      </div>
      <p className="text-lg sm:text-3xl font-bold text-white">{formatValue(thisMonth)}</p>
      <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-700/50">
        <span className="text-[10px] sm:text-xs text-slate-500">Last: <span className="font-medium text-slate-300">{formatValue(lastMonth)}</span></span>
        {isFlat ? (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500">
            <Minus className="w-3 h-3" /> 0%
          </span>
        ) : (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{pctChange}%
          </span>
        )}
      </div>
    </div>
  );
}