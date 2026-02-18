import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Shield, AlertCircle, Percent, Banknote, ArrowRightLeft } from 'lucide-react';

function Stat({ label, value, sub, icon: Icon, iconColor, iconBg, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.3 }}
      className="bg-slate-900/50 rounded-lg p-3"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`p-1 rounded-md ${iconBg}`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function ARLight({ status }) {
  const config = {
    green: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/40', label: 'All Current' },
    yellow: { color: 'bg-amber-500', glow: 'shadow-amber-500/40', label: '$1k+ 7+ Days Past Due' },
    red: { color: 'bg-red-500', glow: 'shadow-red-500/40', label: 'Invoice 15+ Days Past Due' },
  };
  const c = config[status] || config.green;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="flex items-center gap-2.5 bg-slate-900/50 rounded-lg p-3"
    >
      <div className="relative">
        <div className={`w-4 h-4 rounded-full ${c.color} shadow-lg ${c.glow}`} />
        {status !== 'green' && (
          <div className={`absolute inset-0 w-4 h-4 rounded-full ${c.color} animate-ping opacity-30`} />
        )}
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">AR Health</p>
        <p className={`text-xs font-bold ${
          status === 'green' ? 'text-emerald-400' : status === 'yellow' ? 'text-amber-400' : 'text-red-400'
        }`}>{c.label}</p>
      </div>
    </motion.div>
  );
}

export default function CashHealthPanel({ data }) {
  if (!data) return null;
  const d = data;
  const fmt = (v) => `$${Math.round(v).toLocaleString()}`;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Banknote className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-white">Cash Health (MTD)</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <Stat
          index={0}
          label="Realized Revenue"
          value={fmt(d.realizedRevenue)}
          sub="Cash actually collected"
          icon={DollarSign}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <Stat
          index={1}
          label="Projected Revenue"
          value={fmt(d.projectedRevenue)}
          sub="Earned but not yet collected"
          icon={TrendingUp}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <Stat
          index={2}
          label="Unbilled"
          value={fmt(d.unbilledRevenue)}
          sub="Projected − Collected"
          icon={ArrowRightLeft}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <Stat
          index={3}
          label="Accrued Expenses"
          value={fmt(d.accruedExpenses)}
          sub={`Pro-rated ${Math.round(d.proRataFraction * 100)}% of month`}
          icon={AlertCircle}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
        />
        <Stat
          index={4}
          label="Real-Time Margin"
          value={`${d.accruedGrossMargin.toFixed(1)}%`}
          sub="Gross margin (accrued)"
          icon={Percent}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
        <Stat
          index={5}
          label="Retainer Coverage"
          value={`${d.retainerCoverageRatio}%`}
          sub={`${fmt(d.monthlyRetainerRevenue)} / ${fmt(d.totalFixedOverhead)}`}
          icon={Shield}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
        />
        <ARLight status={d.arHealth} />
      </div>
    </div>
  );
}