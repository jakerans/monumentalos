import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GOAL_COLORS = {
  green: { bar: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  blue: { bar: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  amber: { bar: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  red: { bar: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
};

function getColor(pct) {
  if (pct >= 100) return GOAL_COLORS.green;
  if (pct >= 70) return GOAL_COLORS.blue;
  if (pct >= 40) return GOAL_COLORS.amber;
  return GOAL_COLORS.red;
}

function ProgressRow({ label, current, goal, format = 'dollar', index = 0 }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const formatVal = (v) => format === 'percent' ? `${v.toFixed(1)}%` : `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const c = getColor(pct);
  const met = pct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {met && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          <span className="text-[11px] text-slate-300 font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-white">{formatVal(current)}</span>
          <span className="text-[10px] text-slate-500">/ {formatVal(goal)}</span>
          <motion.span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ color: c.bar, backgroundColor: `${c.bar}15` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 250, damping: 18 }}
          >
            {pct.toFixed(0)}%
          </motion.span>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: c.bar, boxShadow: `0 0 8px ${c.glow}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3 + index * 0.1, duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function MTDGoalProgress({ currentGoal, mtdData }) {
  if (!currentGoal) return null;

  const goals = [
    currentGoal.gross_revenue_goal > 0 && { label: 'Gross Revenue', current: mtdData.grossRevenue, goal: currentGoal.gross_revenue_goal },
    currentGoal.cash_collected_goal > 0 && { label: 'Cash Collected', current: mtdData.collected, goal: currentGoal.cash_collected_goal },
    currentGoal.gross_margin_goal > 0 && { label: 'Gross Margin', current: mtdData.grossMargin, goal: currentGoal.gross_margin_goal, format: 'percent' },
    currentGoal.net_margin_goal > 0 && { label: 'Net Margin', current: mtdData.netMargin, goal: currentGoal.net_margin_goal, format: 'percent' },
    currentGoal.net_profit_goal > 0 && { label: 'Net Profit', current: mtdData.netProfit, goal: currentGoal.net_profit_goal },
  ].filter(Boolean);

  if (goals.length === 0) return null;

  const metCount = goals.filter(g => g.goal > 0 && (g.current / g.goal) >= 1).length;
  const overallPct = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + Math.min((g.current / g.goal) * 100, 100), 0) / goals.length) : 0;
  const ringColor = getColor(overallPct);
  const ringData = [{ value: overallPct }, { value: Math.max(0, 100 - overallPct) }];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4" style={{color:'#D6FF03'}} />
        <h3 className="text-sm font-bold text-white">Monthly Goal Progress</h3>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="w-[72px] h-[72px] relative flex-shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 16px ${ringColor.glow}` }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ringData}
                innerRadius={22}
                outerRadius={32}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
                isAnimationActive={true}
                animationDuration={1200}
              >
                <Cell fill={ringColor.bar} style={{ filter: `drop-shadow(0 0 4px ${ringColor.glow})` }} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-sm font-black"
              style={{ color: ringColor.bar }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
            >
              {overallPct}%
            </motion.span>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400">{metCount} of {goals.length} goals met</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Average progress across all targets</p>
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {goals.map((g, i) => (
          <ProgressRow key={g.label} label={g.label} current={g.current} goal={g.goal} format={g.format} index={i} />
        ))}
      </div>
    </div>
  );
}