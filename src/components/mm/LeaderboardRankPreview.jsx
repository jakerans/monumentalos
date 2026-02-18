import React from 'react';
import { Trophy, TrendingUp, Medal, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const RANK_CONFIG = {
  1: {
    label: '#1',
    emoji: '👑',
    title: 'You\'re the #1 Setter!',
    subtitle: 'Leading the pack this month',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    glowColor: 'rgba(255,215,0,0.3)',
    accentColor: '#FFD700',
    icon: Crown,
    bgGradient: 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,165,0,0.06) 50%, transparent 100%)',
  },
  2: {
    label: '#2',
    emoji: '🥈',
    title: 'You\'re #2',
    subtitle: 'Right behind the leader',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
    glowColor: 'rgba(148,163,184,0.25)',
    accentColor: '#C0C0C0',
    icon: Medal,
    bgGradient: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(148,163,184,0.04) 50%, transparent 100%)',
  },
  3: {
    label: '#3',
    emoji: '🥉',
    title: 'You\'re #3',
    subtitle: 'On the podium — keep pushing',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    glowColor: 'rgba(249,115,22,0.2)',
    accentColor: '#CD7F32',
    icon: Medal,
    bgGradient: 'linear-gradient(135deg, rgba(205,127,50,0.08) 0%, rgba(249,115,22,0.04) 50%, transparent 100%)',
  },
};

export default function LeaderboardRankPreview({ rank }) {
  if (!rank || !RANK_CONFIG[rank]) return null;
  const config = RANK_CONFIG[rank];
  const IconComp = config.icon;
  const isFirst = rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden relative"
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{ background: config.bgGradient }}
        animate={isFirst ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2 relative z-10">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Leaderboard Rank Preview</h3>
      </div>

      {/* Rank display */}
      <div className="p-5 relative z-10">
        <div className="flex items-center gap-5">
          {/* Big rank badge */}
          <motion.div
            className="flex-shrink-0 relative"
            animate={isFirst ? { scale: [1, 1.05, 1] } : {}}
            transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
          >
            <div
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 ${config.badgeColor}`}
              style={{ boxShadow: `0 0 20px ${config.glowColor}` }}
            >
              <span className="text-2xl mb-0.5">{config.emoji}</span>
              <span className="text-xl font-black" style={{ color: config.accentColor }}>{config.label}</span>
            </div>

            {/* Gold liquid effect for #1 */}
            {isFirst && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, transparent 60%)' }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -inset-1 rounded-2xl pointer-events-none"
                  animate={{ boxShadow: [`0 0 12px ${config.glowColor}`, `0 0 24px rgba(255,215,0,0.5)`, `0 0 12px ${config.glowColor}`] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <IconComp className="w-4 h-4" style={{ color: config.accentColor }} />
              <motion.span
                className="text-lg font-black text-white"
                animate={isFirst ? { color: ['#ffffff', '#FFD700', '#ffffff'] } : {}}
                transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
              >
                {config.title}
              </motion.span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{config.subtitle}</p>

            {/* Fake stats for preview */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-lg font-bold" style={{ color: '#D6FF03' }}>
                  {rank === 1 ? 24 : rank === 2 ? 21 : 18}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">booked</span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-300">
                  {rank === 1 ? '3m' : rank === 2 ? '5m' : '7m'}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">avg STL</span>
              </div>
              <div className="flex items-center gap-0.5 text-xs font-medium text-green-400">
                <TrendingUp className="w-3.5 h-3.5" />
                +{rank === 1 ? 2 : rank === 2 ? 1 : 0}
                <span className="text-[10px] text-slate-500 ml-0.5">vs last mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini podium visualization */}
        <div className="mt-4 flex items-end justify-center gap-2">
          {[2, 1, 3].map(pos => {
            const isActive = pos === rank;
            const heights = { 1: 'h-14', 2: 'h-10', 3: 'h-8' };
            const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
            return (
              <motion.div
                key={pos}
                className={`w-16 ${heights[pos]} rounded-t-lg flex flex-col items-center justify-start pt-1.5 transition-all`}
                style={{
                  backgroundColor: isActive ? colors[pos] + '33' : 'rgba(51,65,85,0.3)',
                  borderTop: `2px solid ${isActive ? colors[pos] : 'transparent'}`,
                  boxShadow: isActive ? `0 0 12px ${colors[pos]}44` : 'none',
                }}
                animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
              >
                <span className="text-[10px] font-bold" style={{ color: isActive ? colors[pos] : '#64748b' }}>
                  #{pos}
                </span>
                {isActive && (
                  <motion.span
                    className="text-[8px] font-bold mt-0.5"
                    style={{ color: colors[pos] }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    YOU
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}