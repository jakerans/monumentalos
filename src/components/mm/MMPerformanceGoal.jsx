import React, { useState } from 'react';
import { Trophy, Flame, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ArcadeOverheatMeter from './ArcadeOverheatMeter';
import WidgetFireBorder from './WidgetFireBorder';
import PerfGoalTester from './PerfGoalTester';

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

export default function MMPerformanceGoal({ plans, showTester = false }) {
  const activePlans = (plans || []).filter(p => p.status === 'active');
  const [progressOverride, setProgressOverride] = useState(null);
  if (activePlans.length === 0 && !showTester) return null;

  // Build display plans with optional override
  const displayPlans = activePlans.length > 0 ? activePlans : (showTester ? [{
    id: 'demo', name: 'Revenue Commission', status: 'active', frequency: 'monthly',
    current_period_progress: 0, current_period_payout: 0,
    tiers: [
      { threshold: 50000, percentage: 3, label: 'Tier 1' },
      { threshold: 70000, percentage: 5, label: 'Tier 2' },
      { threshold: 100000, percentage: 8, label: 'Max' },
    ]
  }] : []);

  // Compute fire intensity: 0=none, 1=T1 (subtle white), 2=T2 (warning), 3=approaching max, 4=MAX (inferno)
  const fireIntensity = (() => {
    let maxIntensity = 0;
    displayPlans.forEach(plan => {
      const progress = progressOverride != null ? progressOverride : (plan.current_period_progress || 0);
      const sortedTiers = [...(plan.tiers || [])].sort((a, b) => a.threshold - b.threshold);
      const maxThreshold = sortedTiers.length > 0 ? Math.max(...sortedTiers.map(t => t.threshold)) : 100;
      const pct = maxThreshold > 0 ? (progress / maxThreshold) * 100 : 0;
      const tierIdx = (() => {
        let idx = -1;
        for (let i = 0; i < sortedTiers.length; i++) {
          if (progress >= sortedTiers[i].threshold) idx = i;
        }
        return idx;
      })();
      let intensity = 0;
      if (pct >= 100) intensity = 4;        // MAX — full inferno
      else if (pct >= 80) intensity = 3;     // Approaching max — strong fire
      else if (tierIdx >= 1) intensity = 2;  // T2 — warning flames
      else if (tierIdx >= 0) intensity = 1;  // T1 — subtle white flames
      if (intensity > maxIntensity) maxIntensity = intensity;
    });
    return maxIntensity;
  })();
  const anyTopped = fireIntensity >= 4;

  return (
    <WidgetFireBorder active={fireIntensity >= 1} intensity={fireIntensity}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden relative"
      >
        {/* Fire overlay tint when maxed */}
        {anyTopped && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-0 rounded-lg"
            style={{ background: 'linear-gradient(180deg, rgba(255,69,0,0.06) 0%, rgba(255,170,0,0.03) 50%, transparent 100%)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2 relative z-10">
          {anyTopped ? (
            <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
              <Flame className="w-4 h-4 text-orange-400" />
            </motion.div>
          ) : (
            <Trophy className="w-4 h-4 text-amber-400" />
          )}
          <h3 className="text-sm font-bold text-white">
            {anyTopped ? (
              <motion.span
                animate={{ color: ['#ffffff', '#ff6b35', '#ffaa00', '#ffffff'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🔥 PERFORMANCE ON FIRE 🔥
              </motion.span>
            ) : 'My Performance Goals'}
          </h3>
        </div>
        <div className="p-3 space-y-3 relative z-10">
          {showTester && (
            <PerfGoalTester onOverride={setProgressOverride} />
          )}
          {displayPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} progressOverride={progressOverride} />
          ))}
        </div>
      </motion.div>
    </WidgetFireBorder>
  );
}

function PlanCard({ plan, progressOverride }) {
  const progress = progressOverride != null ? progressOverride : (plan.current_period_progress || 0);
  const payout = plan.current_period_payout || 0;
  const currentTier = getCurrentTier(plan);
  const nextTier = getNextTier(plan);
  const tierIdx = getTierIndex(plan);
  const sortedTiers = [...(plan.tiers || [])].sort((a, b) => a.threshold - b.threshold);
  const maxThreshold = sortedTiers.length > 0 ? Math.max(...sortedTiers.map(t => t.threshold)) : 100;
  const overallPct = maxThreshold > 0 ? Math.min((progress / maxThreshold) * 100, 100) : 0;
  const topped = overallPct >= 100;

  const currentTierForColor = (() => {
    const sorted = [...(plan.tiers || [])].sort((a, b) => a.threshold - b.threshold);
    let ct = null;
    for (const tier of sorted) {
      if (progress >= tier.threshold) ct = tier;
    }
    return ct;
  })();
  const tierColor = topped ? '#D6FF03' : currentTierForColor ? '#8b5cf6' : '#475569';
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
        {/* Arcade Overheat Meter */}
        <div className="flex-shrink-0">
          <ArcadeOverheatMeter
            fillPct={overallPct}
            topped={topped}
          />
          <p className="text-center mt-1">
            <motion.span
              className="text-[11px] font-black"
              style={{ color: topped ? '#ff2d2d' : tierColor }}
              initial={{ scale: 0 }}
              animate={topped ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={topped ? { duration: 0.5, repeat: Infinity } : { delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
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