import React, { useState, forwardRef } from 'react';
import { Trophy, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, Calendar, Gift, Crown, Medal } from 'lucide-react';
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

  // Order: 2nd, 1st, 3rd for podium layout
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
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx === 0 ? 0.1 : idx === 1 ? 0 : 0.2, duration: 0.4 }}
              className="flex flex-col items-center"
              style={{ width: pos === 1 ? 110 : 90 }}
            >
              {/* Name + stats above podium */}
              <div className="text-center mb-1.5">
                <span className="text-[10px]">{c.emoji}</span>
                <p className={`text-xs font-bold truncate max-w-[90px] ${isMe ? 'text-white' : 'text-slate-300'}`}>
                  {s.name?.split(' ')[0]}
                </p>
                <p className="text-[10px] font-bold" style={{ color: '#D6FF03' }}>{s.booked} booked</p>
                {s.avgSTL != null && <p className="text-[8px] text-slate-500">{s.avgSTL}m STL</p>}
              </div>

              {/* Podium block */}
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

export default function LeaderboardWidget({ user, leaderboard, lastMonthBoard, spiffs, leads }) {
  const [open, setOpen] = useState(false);

  const myIndex = leaderboard.findIndex(s => s.id === user.id);
  const isOnBoard = myIndex !== -1;
  const myRank = isOnBoard ? myIndex + 1 : null;
  const myStats = isOnBoard ? leaderboard[myIndex] : null;
  const lastMyStats = lastMonthBoard.find(s => s.id === user.id);
  const lastRank = lastMyStats ? lastMonthBoard.findIndex(s => s.id === user.id) + 1 : null;

  const rankChange = (lastRank && myRank) ? lastRank - myRank : null;
  // For admins viewing setter dashboard, show the #1 setter's rank context
  const displayRank = myRank || (leaderboard.length > 0 ? 1 : null);
  const isFirst = displayRank === 1;
  const isSecond = displayRank === 2;
  const isThird = displayRank === 3;
  const isTop3 = isFirst || isSecond || isThird;

  // Rank-based color configs
  const rankConfig = isFirst
    ? { border: 'border-amber-500/70', text: '#FFD700', sub: 'text-amber-300', trophy: 'text-yellow-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]', tabShadow: '0 0 25px rgba(255,215,0,0.5), 0 0 50px rgba(255,165,0,0.25)', panelShadow: '0 0 40px rgba(255,215,0,0.2), 5px 0 30px rgba(255,165,0,0.12)', innerGlow: 'linear-gradient(180deg, rgba(255,215,0,0.08) 0%, rgba(255,165,0,0.03) 30%, transparent 60%)', innerGlowBottom: 'linear-gradient(0deg, rgba(255,215,0,0.06) 0%, transparent 40%)', pulseGlow: true }
    : isSecond
    ? { border: 'border-slate-400/50', text: '#C0C0C0', sub: 'text-slate-300', trophy: 'text-slate-300 drop-shadow-[0_0_6px_rgba(192,192,192,0.5)]', tabShadow: '0 0 15px rgba(192,192,192,0.3), 0 0 30px rgba(148,163,184,0.15)', panelShadow: '0 0 25px rgba(192,192,192,0.1), 5px 0 20px rgba(148,163,184,0.08)', innerGlow: 'linear-gradient(180deg, rgba(192,192,192,0.05) 0%, rgba(148,163,184,0.02) 30%, transparent 60%)', innerGlowBottom: 'linear-gradient(0deg, rgba(192,192,192,0.04) 0%, transparent 40%)', pulseGlow: false }
    : isThird
    ? { border: 'border-orange-500/40', text: '#CD7F32', sub: 'text-orange-300', trophy: 'text-orange-400 drop-shadow-[0_0_4px_rgba(205,127,50,0.4)]', tabShadow: '0 0 10px rgba(205,127,50,0.25), 0 0 20px rgba(205,127,50,0.1)', panelShadow: '0 0 18px rgba(205,127,50,0.08), 5px 0 15px rgba(205,127,50,0.05)', innerGlow: 'linear-gradient(180deg, rgba(205,127,50,0.04) 0%, rgba(180,100,30,0.02) 30%, transparent 60%)', innerGlowBottom: 'linear-gradient(0deg, rgba(205,127,50,0.03) 0%, transparent 40%)', pulseGlow: false }
    : { border: 'border-slate-600', text: '#D6FF03', sub: 'text-slate-400', trophy: 'text-amber-400', tabShadow: 'none', panelShadow: 'none', innerGlow: 'none', innerGlowBottom: 'none', pulseGlow: false };

  // Calculate spiff progress for current user
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const getSpiffProgress = (spiff) => {
    if (spiff.qualifier === 'appointments') {
      if (spiff.scope === 'team_company') {
        return leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user.id;
      return leads.filter(l => l.booked_by_setter_id === setterId && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    }
    if (spiff.qualifier === 'stl') {
      if (spiff.scope === 'team_company') {
        const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
        return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user.id;
      const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
      return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
    }
    return 0;
  };

  const mySpiffs = spiffs.filter(sp => {
    if (sp.status !== 'active') return false;
    if (sp.scope === 'individual') return sp.assigned_setter_id === user.id;
    return true;
  });

  return (
    <>
      {/* Animations handled by framer-motion + FlipMove */}

      {/* Tab on the left edge */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed left-0 top-[38%] -translate-y-1/2 z-40 flex items-center gap-3 pl-4 pr-5 py-4 rounded-r-2xl border border-l-0 overflow-hidden bg-slate-800 ${rankConfig.border} ${!isTop3 ? 'hover:bg-slate-700' : ''}`}
        style={{ boxShadow: rankConfig.tabShadow }}
        animate={isFirst ? { boxShadow: ['0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,165,0,0.2)', '0 0 35px rgba(255,215,0,0.6), 0 0 60px rgba(255,165,0,0.3)', '0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,165,0,0.2)'] } : {}}
        transition={isFirst ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        {/* Animated liquid background for top 3 */}
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

        <Trophy className={`w-6 h-6 relative z-10 ${rankConfig.trophy}`} />
        <div className="flex flex-col items-start relative z-10">
          <span className="text-lg font-black leading-tight" style={{ color: rankConfig.text }}>#{displayRank || '—'}</span>
          <span className={`text-[10px] font-medium ${rankConfig.sub}`}>Leaderboard</span>
        </div>
      </motion.button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}

      {/* Slide-out panel */}
      <div
        className={`fixed left-0 top-0 h-full w-96 sm:w-[28rem] bg-slate-900 border-r z-50 transform transition-all duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col ${rankConfig.border} overflow-hidden`}
        style={{ boxShadow: open ? rankConfig.panelShadow : 'none' }}
      >
        {/* Inner ambient glow layers */}
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
          {/* Podium at the top */}
          <PodiumDisplay leaderboard={leaderboard} myRank={myRank} />

          {/* My position summary */}
          {myStats && (
            <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Your Position</p>
              <div className="flex items-center gap-3">
                {/* Rank badge with icon */}
                <div className="relative flex flex-col items-center">
                  {isFirst && (
                    <motion.div
                      animate={{ y: [-1, 1, -1], rotate: [-3, 3, -3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] mb-0.5" />
                    </motion.div>
                  )}
                  {isSecond && <Medal className="w-4 h-4 text-slate-300 drop-shadow-[0_0_4px_rgba(192,192,192,0.4)] mb-0.5" />}
                  {isThird && <Medal className="w-4 h-4 text-orange-400 drop-shadow-[0_0_4px_rgba(205,127,50,0.4)] mb-0.5" />}
                  <motion.span
                    className="text-2xl font-black leading-none"
                    style={{ color: rankConfig.text }}
                    animate={isFirst ? { textShadow: ['0 0 8px rgba(255,215,0,0.3)', '0 0 16px rgba(255,215,0,0.6)', '0 0 8px rgba(255,215,0,0.3)'] } : {}}
                    transition={isFirst ? { duration: 2, repeat: Infinity } : {}}
                  >
                    #{myRank}
                  </motion.span>
                </div>

                {/* Stats column */}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-white">{myStats.booked} booked</p>
                  <div className="flex items-center gap-3 text-[10px]">
                    {myStats.avgSTL != null && (
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <Clock className="w-2.5 h-2.5" />{myStats.avgSTL}m avg STL
                      </span>
                    )}
                    {leaderboard[0] && myRank > 1 && (
                      <span className="text-slate-500">
                        {leaderboard[0].booked - myStats.booked} behind #{1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rank change */}
                {rankChange !== null && (
                  <div className={`flex flex-col items-center gap-0.5 ${rankChange > 0 ? 'text-green-400' : rankChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {rankChange > 0 ? <TrendingUp className="w-4 h-4" /> : rankChange < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    <span className="text-[10px] font-bold">{rankChange > 0 ? `+${rankChange}` : rankChange < 0 ? rankChange : '—'}</span>
                    <span className="text-[8px] text-slate-500">vs last mo</span>
                  </div>
                )}
              </div>
              {lastMyStats && (
                <div className="mt-1.5 text-[10px] text-slate-500">
                  Last month: {lastMyStats.booked} booked{lastMyStats.avgSTL != null ? `, ${lastMyStats.avgSTL}m STL` : ''}
                </div>
              )}
            </div>
          )}

          {/* Full leaderboard */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Rankings</p>
            <FlipMove duration={400} easing="cubic-bezier(0.25, 0.46, 0.45, 0.94)" staggerDurationBy={30} enterAnimation="fade" leaveAnimation="fade">
              {leaderboard.map((s, i) => (
                <LeaderboardRow key={s.id} s={s} i={i} userId={user.id} lastMonthBoard={lastMonthBoard} />
              ))}
            </FlipMove>
          </div>


        </div>
      </div>
    </>
  );
}

const LeaderboardRow = forwardRef(({ s, i, userId, lastMonthBoard }, ref) => {
  const isMe = s.id === userId;
  const lastEntry = lastMonthBoard.find(ls => ls.id === s.id);
  const lastPos = lastEntry ? lastMonthBoard.indexOf(lastEntry) + 1 : null;
  const posChange = lastPos ? lastPos - (i + 1) : null;
  return (
    <div ref={ref} className={`flex items-center justify-between py-2 px-2 rounded-md ${isMe ? 'bg-slate-800 border border-slate-700' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
          i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-600 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
        }`}>{i + 1}</span>
        <div>
          <span className={`text-xs font-medium ${isMe ? 'text-white' : 'text-slate-300'}`}>{s.name}</span>
          {s.avgSTL != null && <p className="text-[9px] text-slate-500">{s.avgSTL}m STL</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: '#D6FF03' }}>{s.booked}</span>
        {posChange !== null && posChange !== 0 && (
          <span className={`text-[9px] ${posChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {posChange > 0 ? `↑${posChange}` : `↓${Math.abs(posChange)}`}
          </span>
        )}
      </div>
    </div>
  );
});