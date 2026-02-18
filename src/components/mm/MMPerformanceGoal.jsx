import React, { useState } from 'react';
import { Trophy, Flame, Target, Zap, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import ArcadeOverheatMeter from './ArcadeOverheatMeter';
import WidgetFireBorder from './WidgetFireBorder';
import PerfGoalTester from './PerfGoalTester';

function getTierInfo(tiers, progress) {
  const sorted = [...(tiers || [])].sort((a, b) => a.threshold - b.threshold);
  let currentTier = null;
  let currentIdx = -1;
  let nextTier = null;
  for (let i = 0; i < sorted.length; i++) {
    if (progress >= sorted[i].threshold) { currentTier = sorted[i]; currentIdx = i; }
  }
  nextTier = sorted.find(t => t.threshold > progress) || null;
  const maxThreshold = sorted.length > 0 ? Math.max(...sorted.map(t => t.threshold)) : 100;
  return { currentTier, currentIdx, nextTier, sorted, maxThreshold };
}

// Calculate total bonus earned — tax-bracket style
// Under T1 threshold = $0 (base salary zone)
// T1→T2 range = T1 percentage
// T2→T3 range = T2 percentage  
// Above T3 = T3 percentage
function calcTieredBonus(tiers, progress) {
  const sorted = [...(tiers || [])].sort((a, b) => a.threshold - b.threshold);
  if (sorted.length === 0) return 0;
  let bonus = 0;
  // Below first tier threshold = $0 bonus (base salary)
  for (let i = 0; i < sorted.length; i++) {
    const floor = sorted[i].threshold;
    const ceiling = i < sorted.length - 1 ? sorted[i + 1].threshold : Infinity;
    const pct = (sorted[i].percentage || 0) / 100;
    if (progress <= floor) break;
    const billable = Math.min(progress, ceiling) - floor;
    if (billable > 0) bonus += billable * pct;
  }
  return bonus;
}

export default function MMPerformanceGoal({ plans, showTester = false }) {
  const activePlans = (plans || []).filter(p => p.status === 'active');
  const [progressOverride, setProgressOverride] = useState(null);
  if (activePlans.length === 0 && !showTester) return null;

  const displayPlans = activePlans.length > 0 ? activePlans : (showTester ? [{
    id: 'demo', name: 'Revenue Commission', status: 'active', frequency: 'monthly',
    current_period_progress: 0, current_period_payout: 0,
    tiers: [
      { threshold: 0, percentage: 0, label: 'Base' },
      { threshold: 50000, percentage: 5, label: 'Tier 1' },
      { threshold: 70000, percentage: 8, label: 'Tier 2' },
      { threshold: 100000, percentage: 10, label: 'Tier 3' },
    ]
  }] : []);

  // Fire intensity: only the widget border blazes at T3 (tierIdx === 2 means all 3 reached)
  const fireIntensity = (() => {
    let max = 0;
    displayPlans.forEach(plan => {
      const progress = progressOverride != null ? progressOverride : (plan.current_period_progress || 0);
      const { currentIdx, maxThreshold } = getTierInfo(plan.tiers, progress);
      const pct = maxThreshold > 0 ? (progress / maxThreshold) * 100 : 0;
      // Only blaze widget fire at T3 (last tier reached)
      if (pct >= 100 || currentIdx >= sorted.length - 1) { max = 4; }
    });
    return max;
  })();

  const isT3 = fireIntensity >= 4;

  return (
    <WidgetFireBorder active={isT3} intensity={4}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden relative"
      >
        {isT3 && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-0 rounded-lg"
            style={{ background: 'linear-gradient(180deg, rgba(255,69,0,0.06) 0%, rgba(255,170,0,0.03) 50%, transparent 100%)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2 relative z-10">
          {isT3 ? (
            <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
              <Flame className="w-4 h-4 text-orange-400" />
            </motion.div>
          ) : (
            <Trophy className="w-4 h-4 text-amber-400" />
          )}
          <h3 className="text-sm font-bold text-white">
            {isT3 ? (
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
          {showTester && <PerfGoalTester onOverride={setProgressOverride} />}
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
  const { currentTier, currentIdx, nextTier, sorted, maxThreshold } = getTierInfo(plan.tiers, progress);
  // Show progress toward next tier (or max if all tiers reached)
  const displayTarget = nextTier ? nextTier.threshold : maxThreshold;
  const overallPct = maxThreshold > 0 ? Math.min((progress / maxThreshold) * 100, 100) : 0;
  const topped = overallPct >= 100;

  // Calculate bonus
  const bonus = calcTieredBonus(plan.tiers, progress);

  const tierColor = topped ? '#D6FF03' : currentTier ? '#8b5cf6' : '#475569';
  const tierGlow = topped ? 'rgba(214,255,3,0.3)' : currentTier ? 'rgba(139,92,246,0.3)' : 'rgba(71,85,105,0.2)';
  const remaining = nextTier ? nextTier.threshold - progress : 0;

  // Scale text size per tier: no tier=base, T1=medium, T2=large, T3=xl
  // Text scaling based on how many tiers reached (excluding Base tier)
  const effectiveTierIdx = currentTier && currentTier.percentage > 0 ? sorted.filter((t, i) => i <= currentIdx && t.percentage > 0).length - 1 : -1;
  const revenueTextSize = topped ? 'text-2xl' : effectiveTierIdx >= 1 ? 'text-xl' : effectiveTierIdx >= 0 ? 'text-lg' : 'text-base';
  const bonusTextSize = topped ? 'text-xl' : effectiveTierIdx >= 1 ? 'text-base' : effectiveTierIdx >= 0 ? 'text-sm' : 'text-xs';

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
          <ArcadeOverheatMeter fillPct={overallPct} topped={topped} tierIdx={currentIdx} />
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
          {/* Revenue */}
          <div className="flex items-baseline gap-1.5 mb-1">
            <motion.span
              className={`${revenueTextSize} font-black text-white`}
              animate={topped ? { scale: [1, 1.03, 1] } : {}}
              transition={topped ? { duration: 1, repeat: Infinity } : {}}
            >
              ${progress.toLocaleString()}
            </motion.span>
            <span className="text-[10px] text-slate-500">/ ${displayTarget.toLocaleString()}</span>
          </div>

          {/* Bonus pay */}
          {bonus > 0 && (
            <div className="flex items-center gap-1.5 mb-1.5 relative">
              {topped ? (
                <motion.div
                  className="flex items-center gap-1.5"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    <DollarSign className="w-4 h-4" style={{ color: '#FFD700' }} />
                  </motion.div>
                  <motion.span
                    className={`${bonusTextSize} font-black`}
                    animate={{ color: ['#FFD700', '#FFA500', '#FF6B35', '#FFD700'] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ textShadow: '0 0 8px rgba(255,165,0,0.6), 0 0 16px rgba(255,107,53,0.4)' }}
                  >
                    ${bonus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} bonus
                  </motion.span>
                </motion.div>
              ) : (
                <>
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className={`${bonusTextSize} font-bold text-emerald-400`}>
                    ${bonus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} bonus
                  </span>
                </>
              )}
            </div>
          )}

          {/* Next tier info */}
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
      {sorted.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {sorted.map((tier, i) => {
            const reached = i <= currentIdx;
            const isNext = i === currentIdx + 1;
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
                  {tier.label} ${(tier.threshold / 1000).toFixed(0)}k
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}