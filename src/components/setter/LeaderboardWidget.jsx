import React, { useState, forwardRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronLeft, TrendingUp, TrendingDown, Clock, Crown, Medal, Gift, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FlipMove from 'react-flip-move';

const PODIUM_COLORS = {
  1: { accent: '#FFD700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.4)', glow: 'rgba(255,215,0,0.3)', emoji: '👑' },
  2: { accent: '#C0C0C0', bg: 'rgba(192,192,192,0.10)', border: 'rgba(192,192,192,0.3)', glow: 'rgba(192,192,192,0.15)', emoji: '🥈' },
  3: { accent: '#CD7F32', bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.3)', glow: 'rgba(205,127,50,0.15)', emoji: '🥉' },
};

function PodiumDisplay({ leaderboard, myRank }) {
  const top3 = leaderboard.slice(0, 3);
  if (top3.length === 0) return null;

  const podiumOrder = [1, 0, 2].filter(i => i < top3.length);
  const heights = { 0: 80, 1: 60, 2: 48 };
  const nameHeights = { 0: 'pt-2', 1: 'pt-1.5', 2: 'pt-1' };

  return (
    <div className="px-4 py-4 border-b border-slate-700/50">
      <div className="flex items-end justify-center gap-2">
        {podiumOrder.map(idx => {
          const s = top3[idx];
          const pos = idx + 1;
          const c = PODIUM_COLORS[pos];
          const isMe = myRank === pos;

          return (
            <motion.div
              key={s.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx === 0 ? 0.1 : idx === 1 ? 0 : 0.2, duration: 0.4 }}
              className="flex flex-col items-center"
              style={{ width: pos === 1 ? 110 : 90 }}
            >
              <div className="text-center mb-1.5">
                <span className="text-[10px]">{c.emoji}</span>
                <p className={`text-xs font-bold truncate max-w-[90px] ${isMe ? 'text-white' : 'text-slate-300'}`}>
                  {s.full_name?.split(' ')[0]}
                </p>
                <p className="text-[10px] font-bold" style={{ color: '#D6FF03' }}>{s.mtd_booked} booked</p>
                {s.mtd_avg_stl != null && <p className="text-[8px] text-slate-500">{s.mtd_avg_stl}m STL</p>}
              </div>

              <motion.div
                className={`w-full rounded-t-lg flex flex-col items-center ${nameHeights[idx]}`}
                style={{
                  height: heights[idx],
                  backgroundColor: c.bg,
                  borderTop: `2px solid ${c.border}`,
                  borderLeft: `1px solid ${c.border}`,
                  borderRight: `1px solid ${c.border}`,
                  boxShadow: isMe ? `0 0 16px ${c.glow}, inset 0 0 12px ${c.glow}` : `0 0 8px ${c.glow}`,
                }}
                animate={isMe ? { boxShadow: [`0 0 16px ${c.glow}, inset 0 0 12px ${c.glow}`, `0 0 24px ${c.accent}66, inset 0 0 18px ${c.glow}`, `0 0 16px ${c.glow}, inset 0 0 12px ${c.glow}`] } : {}}
                transition={isMe ? { duration: 2, repeat: Infinity } : {}}
              >
                <span className="text-sm font-black" style={{ color: c.accent }}>#{pos}</span>
                {isMe && (
                  <motion.span
                    className="text-[8px] font-bold"
                    style={{ color: c.accent }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    YOU
                  </motion.span>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardWidget({ user, spiffs, leaderboardProfiles }) {
  const [open, setOpen] = useState(false);

  // Use pre-fetched profiles if available, otherwise fetch (backward compat)
  const { data: fetchedProfiles = [] } = useQuery({
    queryKey: ['setter-profiles-leaderboard'],
    queryFn: () => base44.entities.SetterProfile.filter({ status: 'active' }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: !leaderboardProfiles,
  });

  const profiles = leaderboardProfiles || fetchedProfiles;

  // Sort by mtd_booked descending
  const leaderboard = [...profiles].sort((a, b) => (b.mtd_booked || 0) - (a.mtd_booked || 0));
  const lastMonthBoard = [...profiles].sort((a, b) => (b.last_month_booked || 0) - (a.last_month_booked || 0));

  const myIndex = leaderboard.findIndex(s => s.user_id === user.id);
  const isOnBoard = myIndex !== -1;
  const myRank = isOnBoard ? myIndex + 1 : null;
  const myStats = isOnBoard ? leaderboard[myIndex] : null;
  const lastMyIndex = lastMonthBoard.findIndex(s => s.user_id === user.id);
  const lastRank = lastMyIndex !== -1 ? lastMyIndex + 1 : null;

  const rankChange = (lastRank && myRank) ? lastRank - myRank : null;
  const displayRank = myRank || (leaderboard.length > 0 ? 1 : null);
  const isFirst = displayRank === 1;
  const isSecond = displayRank === 2;
  const isThird = displayRank === 3;
  const isTop3 = isFirst || isSecond || isThird;

  const rankConfig = isFirst
    ? { border: 'border-amber-500/70', text: '#FFD700', sub: 'text-amber-300', trophy: 'text-yellow-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]', tabShadow: '0 0 25px rgba(255,215,0,0.5), 0 0 50px rgba(255,165,0,0.25)', panelShadow: '0 0 40px rgba(255,215,0,0.2), 5px 0 30px rgba(255,165,0,0.12)', innerGlow: 'linear-gradient(180deg, rgba(255,215,0,0.08) 0%, rgba(255,165,0,0.03) 30%, transparent 60%)', innerGlowBottom: 'linear-gradient(0deg, rgba(255,215,0,0.06) 0%, transparent 40%)', pulseGlow: true }
    : isSecond
    ? { border: 'border-slate-400/50', text: '#C0C0C0', sub: 'text-slate-300', trophy: 'text-slate-300 drop-shadow-[0_0_6px_rgba(192,192,192,0.5)]', tabShadow: '0 0 15px rgba(192,192,192,0.3), 0 0 30px rgba(148,163,184,0.15)', panelShadow: '0 0 25px rgba(192,192,192,0.1), 5px 0 20px rgba(148,163,184,0.08)', innerGlow: 'linear-gradient(180deg, rgba(192,192,192,0.05) 0%, rgba(148,163,184,0.02) 30%, transparent 60%)', innerGlowBottom: 'linear-gradient(0deg, rgba(192,192,192,0.04) 0%, transparent 40%)', pulseGlow: false }
    : isThird
    ? { border: 'border-orange-500/40', text: '#CD7F32', sub: 'text-orange-300', trophy: 'text-orange-400 drop-shadow-[0_0_4px_rgba(205,127,50,0.4)]', tabShadow: '0 0 10px rgba(205,127,50,0.25), 0 0 20px rgba(205,127,50,0.1)', panelShadow: '0 0 18px rgba(205,127,50,0.08), 5px 0 15px rgba(205,127,50,0.05)', innerGlow: 'linear-gradient(180deg, rgba(205,127,50,0.04) 0%, rgba(180,100,30,0.02) 30%, transparent 60%)', innerGlowBottom: 'linear-gradient(0deg, rgba(205,127,50,0.03) 0%, transparent 40%)', pulseGlow: false }
    : { border: 'border-slate-600', text: '#D6FF03', sub: 'text-slate-400', trophy: 'text-amber-400', tabShadow: 'none', panelShadow: 'none', innerGlow: 'none', innerGlowBottom: 'none', pulseGlow: false };

  // Spiff calculations

  const relevantSpiffs = (spiffs || []).filter(sp => {
    if (sp.scope === 'individual') return sp.assigned_setter_id === user.id;
    return true;
  });

  return (
    <>
      {/* Tab on the left edge */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed left-0 bottom-3 lg:bottom-auto lg:top-[38%] lg:-translate-y-1/2 z-30 flex flex-col lg:flex-row items-center gap-0.5 lg:gap-3 px-1.5 lg:pl-4 lg:pr-5 py-1.5 lg:py-4 rounded-r-lg lg:rounded-r-2xl border border-l-0 overflow-hidden bg-slate-800 ${rankConfig.border} ${!isTop3 ? 'hover:bg-slate-700' : ''}`}
        style={{ boxShadow: rankConfig.tabShadow }}
        animate={isFirst ? { boxShadow: ['0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,165,0,0.2)', '0 0 35px rgba(255,215,0,0.6), 0 0 60px rgba(255,165,0,0.3)', '0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,165,0,0.2)'] } : {}}
        transition={isFirst ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        {isTop3 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-2xl">
            <motion.div
              className="absolute inset-0"
              style={{
                background: isFirst
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.18) 50%, rgba(255,215,0,0.3) 100%)'
                  : isSecond
                  ? 'linear-gradient(135deg, rgba(192,192,192,0.15) 0%, rgba(148,163,184,0.08) 50%, rgba(192,192,192,0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(205,127,50,0.12) 0%, rgba(180,100,30,0.06) 50%, rgba(205,127,50,0.12) 100%)',
              }}
              animate={{ opacity: isFirst ? [0.5, 0.85, 0.5] : isSecond ? [0.3, 0.55, 0.3] : [0.25, 0.4, 0.25] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[60%]"
              style={{
                background: isFirst
                  ? 'linear-gradient(0deg, rgba(255,215,0,0.45) 0%, rgba(255,165,0,0.2) 40%, transparent 100%)'
                  : isSecond
                  ? 'linear-gradient(0deg, rgba(192,192,192,0.2) 0%, rgba(148,163,184,0.1) 40%, transparent 100%)'
                  : 'linear-gradient(0deg, rgba(205,127,50,0.15) 0%, rgba(180,100,30,0.07) 40%, transparent 100%)',
              }}
              animate={{ y: [0, -4, 2, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {isFirst && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[40%]"
                style={{ background: 'linear-gradient(0deg, rgba(255,236,139,0.35) 0%, transparent 100%)' }}
                animate={{ y: [2, -3, 1, -1, 2], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
        )}

        <Trophy className={`w-3.5 h-3.5 lg:w-6 lg:h-6 relative z-10 ${rankConfig.trophy}`} />
        <span className="text-[10px] lg:text-lg font-black leading-none relative z-10" style={{ color: rankConfig.text }}>#{displayRank || '—'}</span>
      </motion.button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}

      {/* Slide-out panel */}
      <div
        className={`fixed left-0 top-0 h-full w-[85vw] max-w-96 sm:max-w-[28rem] bg-slate-900 border-r z-50 transform transition-all duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col ${rankConfig.border} overflow-hidden`}
        style={{ boxShadow: open ? rankConfig.panelShadow : 'none' }}
      >
        {isTop3 && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none z-0"
              style={{ background: rankConfig.innerGlow }}
              animate={rankConfig.pulseGlow ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={rankConfig.pulseGlow ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none z-0"
              style={{ background: rankConfig.innerGlowBottom }}
              animate={rankConfig.pulseGlow ? { opacity: [0.4, 0.8, 0.4] } : {}}
              transition={rankConfig.pulseGlow ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } : {}}
            />
          </>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 relative z-10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Monthly Leaderboard</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10">
          <PodiumDisplay leaderboard={leaderboard} myRank={myRank} />

          {/* My position summary */}
          {myStats && (
            <div className="px-4 py-5 border-b border-slate-700/50 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isFirst
                    ? 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,165,0,0.06) 50%, transparent 100%)'
                    : isSecond
                    ? 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(148,163,184,0.04) 50%, transparent 100%)'
                    : isThird
                    ? 'linear-gradient(135deg, rgba(205,127,50,0.08) 0%, rgba(249,115,22,0.04) 50%, transparent 100%)'
                    : 'none',
                }}
                animate={isFirst ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
              />

              <div className="relative z-10 flex items-center gap-5">
                <motion.div
                  className="flex-shrink-0 relative"
                  animate={isFirst ? { scale: [1, 1.05, 1] } : {}}
                  transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
                >
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 ${
                      isFirst ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                        : isSecond ? 'bg-slate-500/20 text-slate-300 border-slate-400/40'
                        : isThird ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                    }`}
                    style={{ boxShadow: isTop3 ? `0 0 20px ${isFirst ? 'rgba(255,215,0,0.3)' : isSecond ? 'rgba(148,163,184,0.25)' : 'rgba(249,115,22,0.2)'}` : 'none' }}
                  >
                    <span className="text-2xl mb-0.5">{isFirst ? '👑' : isSecond ? '🥈' : isThird ? '🥉' : '🏆'}</span>
                    <span className="text-xl font-black" style={{ color: rankConfig.text }}>#{myRank}</span>
                  </div>

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
                        animate={{ boxShadow: ['0 0 12px rgba(255,215,0,0.3)', '0 0 24px rgba(255,215,0,0.5)', '0 0 12px rgba(255,215,0,0.3)'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </>
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isFirst ? (
                      <Crown className="w-4 h-4" style={{ color: '#FFD700' }} />
                    ) : isTop3 ? (
                      <Medal className="w-4 h-4" style={{ color: rankConfig.text }} />
                    ) : (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    )}
                    <motion.span
                      className="text-lg font-black text-white"
                      animate={isFirst ? { color: ['#ffffff', '#FFD700', '#ffffff'] } : {}}
                      transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
                    >
                      {isFirst ? "You're the #1 Setter!" : isSecond ? "You're #2" : isThird ? "You're #3" : `You're #${myRank}`}
                    </motion.span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    {isFirst ? 'Leading the pack this month' : isSecond ? 'Right behind the leader' : isThird ? 'On the podium — keep pushing' : myRank <= 5 ? 'Top 5 — climbing the ranks' : 'Keep grinding, you got this'}
                  </p>

                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-lg font-bold" style={{ color: '#D6FF03' }}>{myStats.mtd_booked || 0}</span>
                      <span className="text-[10px] text-slate-500 ml-1">booked</span>
                    </div>
                    {myStats.mtd_avg_stl != null && (
                      <div>
                        <span className="text-sm font-medium text-slate-300">{myStats.mtd_avg_stl}m</span>
                        <span className="text-[10px] text-slate-500 ml-1">avg STL</span>
                      </div>
                    )}
                    {rankChange !== null && rankChange !== 0 && (
                      <div className={`flex items-center gap-0.5 text-xs font-medium ${rankChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {rankChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {rankChange > 0 ? `+${rankChange}` : rankChange}
                        <span className="text-[10px] text-slate-500 ml-0.5">vs last mo</span>
                      </div>
                    )}
                    {leaderboard[0] && myRank > 1 && (
                      <div className="text-[10px] text-slate-500">
                        {(leaderboard[0].mtd_booked || 0) - (myStats.mtd_booked || 0)} behind #1
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {myStats.last_month_booked > 0 && (
                <div className="mt-2 text-[10px] text-slate-500 relative z-10">
                  Last month: {myStats.last_month_booked} booked{myStats.last_month_avg_stl != null ? `, ${myStats.last_month_avg_stl}m STL` : ''}
                </div>
              )}
            </div>
          )}

          {/* Full leaderboard */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Rankings</p>
            <FlipMove duration={400} easing="cubic-bezier(0.25, 0.46, 0.45, 0.94)" staggerDurationBy={30} enterAnimation="fade" leaveAnimation="fade">
              {leaderboard.map((s, i) => (
                <LeaderboardRow key={s.user_id} s={s} i={i} userId={user.id} lastMonthBoard={lastMonthBoard} />
              ))}
            </FlipMove>
          </div>

          {/* Spiffs Section */}
          {relevantSpiffs.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5 mb-3">
                <Gift className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Spiffs & Bonuses</p>
              </div>
              <div className="space-y-2.5">
                {relevantSpiffs.map(sp => {
                  const progress = sp._progress ?? 0;
                  const isSTL = sp.qualifier === 'stl';
                  const pct = isSTL
                    ? (progress != null && sp.goal_value > 0 ? Math.min((sp.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
                    : (sp.goal_value > 0 ? Math.min((progress / sp.goal_value) * 100, 100) : 0);
                  const met = isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);
                  const isExpired = sp.status === 'expired';
                  const isCompleted = sp.status === 'completed';
                  const isDone = isExpired || isCompleted;

                  const barColor = met ? '#ff6b35' : pct >= 75 ? '#D6FF03' : pct >= 50 ? '#8b5cf6' : '#475569';
                  const barGlow = met ? 'rgba(255,107,53,0.5)' : pct >= 75 ? 'rgba(214,255,3,0.3)' : 'rgba(139,92,246,0.2)';

                  return (
                    <motion.div
                      key={sp.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative rounded-lg border overflow-hidden"
                      style={{
                        backgroundColor: met ? 'rgba(30,10,0,0.6)' : isExpired ? 'rgba(30,20,20,0.4)' : 'rgba(30,41,59,0.5)',
                        borderColor: met ? 'rgba(255,107,53,0.4)' : isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(51,65,85,0.5)',
                      }}
                    >
                      {met && (
                        <>
                          <motion.div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,69,0,0.12) 0%, rgba(255,170,0,0.06) 50%, transparent 100%)' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                          <motion.div className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(255,100,0,0.2) 0%, transparent 100%)' }} animate={{ y: [0, -2, 1, -1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                          <motion.div className="absolute inset-0 pointer-events-none rounded-lg" style={{ boxShadow: 'inset 0 0 15px rgba(255,100,0,0.2)' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
                        </>
                      )}

                      {!met && !isDone && pct >= 75 && (
                        <motion.div className="absolute inset-0 pointer-events-none rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(214,255,3,0.06) 0%, transparent 50%)', boxShadow: 'inset 0 0 10px rgba(214,255,3,0.08)' }} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
                      )}

                      <div className="relative z-10 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {met ? (
                              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
                                <Flame className="w-3.5 h-3.5 text-orange-400 drop-shadow-[0_0_4px_rgba(255,100,0,0.5)]" />
                              </motion.div>
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            ) : isExpired ? (
                              <XCircle className="w-3.5 h-3.5 text-red-400/60" />
                            ) : (
                              <Gift className="w-3.5 h-3.5 text-purple-400" />
                            )}
                            <span className={`text-xs font-bold ${met ? 'text-orange-200' : isExpired ? 'text-slate-500' : 'text-white'}`}>
                              {sp.title}
                            </span>
                            {isDone && (
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${isCompleted ? 'bg-green-500/15 text-green-400' : 'bg-red-500/10 text-red-400/70'}`}>
                                {sp.status}
                              </span>
                            )}
                          </div>
                          {sp.reward && (
                            <motion.span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: met ? 'rgba(255,107,53,0.2)' : 'rgba(139,92,246,0.12)',
                                color: met ? '#ffaa00' : '#c084fc',
                              }}
                              animate={met ? { textShadow: ['0 0 4px rgba(255,170,0,0.3)', '0 0 8px rgba(255,170,0,0.6)', '0 0 4px rgba(255,170,0,0.3)'] } : {}}
                              transition={met ? { duration: 1.2, repeat: Infinity } : {}}
                            >
                              {sp.reward}
                            </motion.span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className={met ? 'text-orange-300 font-medium' : 'text-slate-400'}>
                            {isSTL ? `${progress ?? '—'}m avg` : `${progress} / ${sp.goal_value}`}
                            {isSTL ? ` (goal: ≤${sp.goal_value}m)` : ` ${sp.qualifier}`}
                          </span>
                          <div className="flex items-center gap-2">
                            {sp.due_date && (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(sp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <span className={`font-bold ${met ? 'text-orange-400' : 'text-slate-500'}`}>{Math.round(pct)}%</span>
                          </div>
                        </div>

                        <div className="relative w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                              backgroundColor: isExpired && !met ? '#ef4444' : barColor,
                              boxShadow: `0 0 8px ${barGlow}`,
                            }}
                          />
                        </div>

                        {met && (
                          <motion.p className="text-[10px] font-bold text-orange-400 mt-1" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            🔥 Goal Crushed!
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default React.memo(LeaderboardWidget);

const LeaderboardRow = forwardRef(({ s, i, userId, lastMonthBoard }, ref) => {
  const isMe = s.user_id === userId;
  const lastEntry = lastMonthBoard.find(ls => ls.user_id === s.user_id);
  const lastPos = lastEntry ? lastMonthBoard.indexOf(lastEntry) + 1 : null;
  const posChange = lastPos ? lastPos - (i + 1) : null;
  return (
    <div ref={ref} className={`flex items-center justify-between py-2 px-2 rounded-md ${isMe ? 'bg-slate-800 border border-slate-700' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
          i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-600 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
        }`}>{i + 1}</span>
        <div>
          <span className={`text-xs font-medium ${isMe ? 'text-white' : 'text-slate-300'}`}>{s.full_name}</span>
          {s.mtd_avg_stl != null && <p className="text-[9px] text-slate-500">{s.mtd_avg_stl}m STL</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: '#D6FF03' }}>{s.mtd_booked || 0}</span>
        {posChange !== null && posChange !== 0 && (
          <span className={`text-[9px] ${posChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {posChange > 0 ? `↑${posChange}` : `↓${Math.abs(posChange)}`}
          </span>
        )}
      </div>
    </div>
  );
});