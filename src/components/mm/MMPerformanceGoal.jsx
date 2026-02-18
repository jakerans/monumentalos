import React from 'react';
import { Trophy, Flame, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import LiquidGauge from './LiquidGauge';

function getCurrentTier(plan) {
  if (!plan.tiers || plan.tiers.length === 0) return null;
  const progress = plan.current_period_progress || 0;
  let currentTier = null;
  for (const tier of [...plan.tiers].sort((a, b) => a.threshold - b.threshold)) {
    if (progress >= tier.threshold) currentTier = tier;
  }
  return currentTier;
}

function getNextTier(plan) {
  const progress = plan.current_period_progress || 0;
  const sorted = [...(plan.tiers || [])].sort((a, b) => a.threshold - b.threshold);
  return sorted.find(t => t.threshold > progress) || null;
}

function getTierIndex(plan) {
  if (!plan.tiers || plan.tiers.length === 0) return -1;
  const progress = plan.current_period_progress || 0;
  const sorted = [...plan.tiers].sort((a, b) => a.threshold - b.threshold);
  let idx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (progress >= sorted[i].threshold) idx = i;
  }
  return idx;
}

export default function MMPerformanceGoal({ plans }) {
  const activePlans = (plans || []).filter(p => p.status === 'active');
  if (activePlans.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">My Performance Goals</h3>
      </div>
      <div className="p-3 space-y-3">
        {activePlans.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </motion.div>
  );
}

function PlanCard({ plan }) {
  const progress = plan.current_period_progress || 0;
  const payout = plan.current_period_payout || 0;
  const currentTier = getCurrentTier(plan);
  const nextTier = getNextTier(plan);
  const tierIdx = getTierIndex(plan);
  const sortedTiers = [...(plan.tiers || [])].sort((a, b) => a.threshold - b.threshold);
  const maxThreshold = sortedTiers.length > 0 ? Math.max(...sortedTiers.map(t => t.threshold)) : 100;
  const overallPct = maxThreshold > 0 ? Math.min((progress / maxThreshold) * 100, 100) : 0;
  const topped = overallPct >= 100;

  const tierColor = topped ? '#D6FF03' : currentTier ? '#8b5cf6' : '#475569';
  const tierGlow = topped ? 'rgba(214,255,3,0.3)' : currentTier ? 'rgba(139,92,246,0.3)' : 'rgba(71,85,105,0.2)';

  const remaining = nextTier ? nextTier.threshold - progress : 0;

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-white">{plan.name}</span>
        </div>
        <span className="text-[10px] text-slate-500 capitalize px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/50">{plan.frequency}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Liquid gauge */}
        <div className="flex-shrink-0">
          <LiquidGauge
            fillPct={overallPct}
            tierIdx={tierIdx}
            topped={topped}
            nextTierPct={nextTier && nextTier.threshold > 0
              ? Math.max(0, Math.min(1, (progress - (currentTier?.threshold || 0)) / (nextTier.threshold - (currentTier?.threshold || 0))))
              : 0
            }
          />
          <p className="text-center mt-1">
            <motion.span
              className="text-[11px] font-black"
              style={{ color: tierColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
            >
              {overallPct.toFixed(0)}%
            </motion.span>
          </p>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-lg font-black text-white">${progress.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">/ ${maxThreshold.toLocaleString()}</span>
          </div>
          {payout > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">${payout.toLocaleString()} earned</span>
            </div>
          )}
          {nextTier && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Target className="w-3 h-3" />
              <span>${remaining.toLocaleString()} to <span className="text-purple-300 font-medium">{nextTier.label}</span></span>
            </div>
          )}
          {topped && (
            <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#D6FF03' }}>
              <Trophy className="w-3 h-3" /> Max tier reached!
            </div>
          )}
        </div>
      </div>

      {/* Tier progress steps */}
      {sortedTiers.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {sortedTiers.map((tier, i) => {
            const reached = i <= tierIdx;
            const isNext = i === tierIdx + 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-full h-1.5 rounded-full ${reached ? '' : 'bg-slate-700/50'}`}
                  style={reached ? { backgroundColor: tierColor, boxShadow: `0 0 6px ${tierGlow}` } : {}}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                />
                <span className={`text-[9px] truncate max-w-full ${
                  reached ? 'text-purple-300 font-semibold' : isNext ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {tier.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}