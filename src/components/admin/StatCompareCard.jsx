import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

function useAnimatedNumber(target, duration = 800) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setDisplay(target); return; }
    const start = typeof display === 'number' ? display : 0;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let raf;
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * ease);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

function BarSegment({ value, max, color, delay, label }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-16 text-right shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-slate-700/30 rounded-full overflow-hidden relative">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full relative" style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ delay: delay + 0.3, duration: 1.2, repeat: 0 }} className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />
        </motion.div>
      </div>
      <span className="text-xs font-bold text-white w-20 text-right shrink-0">${Math.round(value).toLocaleString()}</span>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{d?.label}</p>
      <p className="text-emerald-400 font-bold">Income: ${(d?.income || 0).toLocaleString()}</p>
      <p className="text-red-400 font-bold">Expenses: ${(d?.expenses || 0).toLocaleString()}</p>
    </div>
  );
}

export default function StatCompareCard({ data }) {
  if (!data) return null;

  const { mtdIncome = 0, mtdExpenses = 0, lmIncome = 0, lmExpenses = 0, cogsTotal = 0, overheadTotal = 0, chartData14 = [] } = data;

  const netMTD = mtdIncome - mtdExpenses;
  const netLM = lmIncome - lmExpenses;

  const animIncome = useAnimatedNumber(mtdIncome);
  const animExpenses = useAnimatedNumber(mtdExpenses);
  const animNet = useAnimatedNumber(netMTD);

  const netChange = netLM !== 0 ? Math.round(((netMTD - netLM) / Math.abs(netLM)) * 100) : netMTD > 0 ? 100 : 0;
  const barMax = Math.max(mtdIncome, mtdExpenses, 1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5 relative overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.08 }} transition={{ delay: 0.8, duration: 1 }} className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ background: netMTD >= 0 ? '#34d399' : '#f87171' }} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }} className="p-1.5 rounded-lg bg-indigo-500/10">
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </motion.div>
          <h3 className="text-sm font-bold text-white">Income vs Expenses</h3>
        </div>
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }} className="text-[10px] font-medium text-slate-500 bg-slate-700/30 px-2 py-0.5 rounded-full">MTD</motion.span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
        {[
          { label: 'Income', val: animIncome, color: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
          { label: 'Expenses', val: animExpenses, color: 'text-red-400', borderColor: 'border-red-500/20' },
          { label: 'Net', val: animNet, color: netMTD >= 0 ? 'text-emerald-400' : 'text-red-400', borderColor: netMTD >= 0 ? 'border-emerald-500/20' : 'border-red-500/20' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }} className={`text-center p-2.5 rounded-lg bg-slate-900/40 border ${item.borderColor}`}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
            <p className={`text-lg font-bold ${item.color} tabular-nums`}>${Math.round(typeof item.val === 'number' ? item.val : 0).toLocaleString()}</p>
            {item.label === 'Net' && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }} className={`inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${netChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {netChange >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {netChange > 0 ? '+' : ''}{netChange}% vs LM
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: 'bottom' }} className="h-28 mb-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData14} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.3} /><stop offset="100%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity={0.3} /><stop offset="100%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} fill="url(#incomeGrad)" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
            <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="space-y-2 relative z-10">
        <BarSegment label="Income" value={mtdIncome} max={barMax} color="#34d399" delay={0.6} />
        <BarSegment label="COGS" value={cogsTotal} max={barMax} color="#fb923c" delay={0.7} />
        <BarSegment label="Overhead" value={overheadTotal} max={barMax} color="#f87171" delay={0.8} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="text-center"><p className="text-[10px] text-slate-500">LM Income</p><p className="text-xs font-bold text-slate-400">${lmIncome.toLocaleString()}</p></div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="text-center"><p className="text-[10px] text-slate-500">MTD Income</p><p className="text-xs font-bold text-emerald-400">${mtdIncome.toLocaleString()}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center"><p className="text-[10px] text-slate-500">LM Expenses</p><p className="text-xs font-bold text-slate-400">${lmExpenses.toLocaleString()}</p></div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="text-center"><p className="text-[10px] text-slate-500">MTD Expenses</p><p className="text-xs font-bold text-red-400">${mtdExpenses.toLocaleString()}</p></div>
        </div>
      </motion.div>
    </motion.div>
  );
}