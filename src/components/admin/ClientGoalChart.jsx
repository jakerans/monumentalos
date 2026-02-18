import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';
import { motion } from 'framer-motion';

const GOAL_STATUSES = [
  { key: 'goal_met', label: 'Goal Met', color: '#10b981', glow: 'rgba(16,185,129,0.4)', bg: 'bg-emerald-500' },
  { key: 'on_track', label: 'On Track', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'bg-blue-500' },
  { key: 'behind_confident', label: 'Behind (Confident)', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: 'bg-amber-500' },
  { key: 'behind_wont_meet', label: "Behind (Won't Meet)", color: '#ef4444', glow: 'rgba(239,68,68,0.4)', bg: 'bg-red-500' },
  { key: 'no_goal', label: 'No Goal Set', color: '#475569', glow: 'rgba(71,85,105,0.3)', bg: 'bg-slate-600' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-slate-900/95 border border-slate-600 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.color, boxShadow: `0 0 6px ${d.payload.color}` }} />
        <span className="text-[11px] font-medium text-white">{d.name}</span>
      </div>
      <p className="text-xs text-slate-400 mt-0.5">{d.value} client{d.value !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function ClientGoalChart({ data }) {
  if (!data) return null;
  const { counts, total, healthyPct } = data;

  const chartData = GOAL_STATUSES.map(s => ({
    name: s.label,
    value: counts[s.key] || 0,
    color: s.color,
    glow: s.glow,
    bg: s.bg,
  })).filter(d => d.value > 0);

  const healthyColor = healthyPct >= 70 ? '#10b981' : healthyPct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4" style={{color:'#D6FF03'}} />
        <h3 className="text-sm font-bold text-white">Client Goal Health</h3>
      </div>

      <div className="flex items-center gap-4 flex-1 min-h-0">
        <div className="w-28 h-28 relative flex-shrink-0">
          <motion.div
            className="absolute inset-1 rounded-full"
            style={{ boxShadow: `0 0 20px ${healthyColor}22, inset 0 0 20px ${healthyColor}11` }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {chartData.map((entry, i) => (
                  <filter key={`glow-${i}`} id={`goal-glow-${i}`}>
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={entry.color} floodOpacity="0.5" />
                  </filter>
                ))}
              </defs>
              <Pie data={chartData} innerRadius={32} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 4px ${entry.glow})` }} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="text-lg font-black" style={{ color: healthyColor }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}>
              {healthyPct}%
            </motion.span>
            <span className="text-[8px] text-slate-400 font-medium">healthy</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {chartData.map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <motion.div key={d.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.glow}` }} />
                    <span className="text-[11px] text-slate-300">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-white">{d.value}</span>
                </div>
                <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.glow}` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: 'easeOut' }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}