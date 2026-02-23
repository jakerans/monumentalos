import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import InfoTooltip from '../shared/InfoTooltip';

function pct(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : cur < 0 ? -100 : 0;
  return Math.round(((cur - prior) / Math.abs(prior)) * 100);
}

function PLCell({ label, current, prior, format = 'dollar', invertColor = false, index = 0, tooltip }) {
  const fmt = (v) => {
    if (format === 'pct') return `${v.toFixed(1)}%`;
    return `$${Math.abs(v).toLocaleString()}`;
  };

  const change = format === 'pct' 
    ? Math.round(current - prior) 
    : pct(current, prior);
  const isPositive = invertColor ? change < 0 : change > 0;
  const isNeg = invertColor ? change > 0 : change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.04 * index, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-900/50 rounded-lg p-3 relative overflow-hidden group"
    >
      <div className="flex items-center gap-1 mb-1">
        <p className="text-[10px] font-medium text-slate-400 uppercase">{label}</p>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <p className="text-lg font-bold text-white">{fmt(current)}</p>
      <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-700/40">
        <span className="text-[10px] text-slate-500">
          Prior: <span className="font-medium text-slate-400">{fmt(prior)}</span>
        </span>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.04 * index + 0.3, type: 'spring', stiffness: 300, damping: 20 }}
          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            change === 0
              ? 'bg-slate-500/10 text-slate-500'
              : isPositive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : change < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
          {change > 0 ? '+' : ''}{change}{format === 'pct' ? 'pp' : '%'}
        </motion.span>
      </div>
    </motion.div>
  );
}

export default function PLComparisonRow({ current, prior }) {
  const items = [
    { label: 'Gross Revenue', cur: current.grossRevenue, pri: prior.grossRevenue, tooltip: 'Total revenue earned this month based on work delivered — showed appointments, booked appointments, and retainer fees. This is what you earned, whether or not clients have paid yet.' },
    { label: 'Cash Collected', cur: current.collected, pri: prior.collected, tooltip: 'Actual money that hit your bank account this month from client payments. This is what you can actually spend.' },
    { label: 'COGS', cur: current.cogs, pri: prior.cogs, invertColor: true, tooltip: 'Your direct costs to deliver the service — setter payroll, contractor fees, and any costs directly tied to running client campaigns. Lower means more of your revenue becomes profit.' },
    { label: 'Overhead', cur: current.overhead, pri: prior.overhead, invertColor: true, tooltip: 'Your fixed costs that exist regardless of how many clients you have — things like software subscriptions, your own salary, office expenses, and any non-COGS payroll.' },
    { label: 'Gross Profit', cur: current.grossProfit, pri: prior.grossProfit, tooltip: "What's left after paying the direct costs of running campaigns. This is your agency's margin before your own salary, software, and other overhead." },
    { label: 'Net Profit', cur: current.netProfit, pri: prior.netProfit, tooltip: "Your true bottom line — what's left after ALL expenses are paid. This is the money that stays in the business or goes in your pocket." },
    { label: 'Gross Margin', cur: current.grossMargin, pri: prior.grossMargin, format: 'pct', tooltip: 'For every dollar of revenue, how many cents are left after direct costs? A 60% margin means you keep 60 cents on every dollar before overhead.' },
    { label: 'Net Margin', cur: current.netMargin, pri: prior.netMargin, format: 'pct', tooltip: 'For every dollar of revenue, how many cents actually become profit after everything is paid? This is the number that tells you if the agency is healthy.' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {items.map((item, i) => (
        <PLCell
          key={item.label}
          label={item.label}
          current={item.cur}
          prior={item.pri}
          format={item.format}
          invertColor={item.invertColor}
          index={i}
          tooltip={item.tooltip}
        />
      ))}
    </div>
  );
}