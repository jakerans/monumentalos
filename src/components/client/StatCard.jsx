import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon: Icon, iconColor, label, thisMonth, lastMonth, format = 'number', index = 0 }) {
  const formatValue = (val) => {
    if (format === 'currency') return `$${val.toLocaleString()}`;
    return val.toLocaleString();
  };

  const pctChange = lastMonth === 0
    ? (thisMonth > 0 ? 100 : 0)
    : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const isUp = pctChange > 0;
  const isDown = pctChange < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.04 * index, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-200"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconColor}`} />
        <p className="text-[10px] sm:text-sm font-medium text-slate-400 leading-tight">{label}</p>
      </div>
      <p className="text-lg sm:text-3xl font-bold text-white">{formatValue(thisMonth)}</p>
      <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-700/50">
        <span className="text-[10px] sm:text-xs text-slate-500">Prior: <span className="font-medium text-slate-400">{formatValue(lastMonth)}</span></span>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.04 * index + 0.35, type: 'spring', stiffness: 300, damping: 20 }}
          className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${
            pctChange === 0
              ? 'bg-slate-500/10 text-slate-500'
              : isUp
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
          {isUp ? '+' : ''}{pctChange}%
        </motion.span>
      </div>
    </motion.div>
  );
}