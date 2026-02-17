import React, { useState } from 'react';
import { Trophy, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, Calendar, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {/* No extra styles needed — animations handled by framer-motion */}

      {/* Tab on the left edge */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed left-0 top-[38%] -translate-y-1/2 z-40 flex items-center gap-3 pl-4 pr-5 py-4 rounded-r-2xl shadow-xl border border-l-0 transition-colors overflow-hidden ${
          isFirst
            ? 'border-amber-500/60 bg-slate-800'
            : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
        }`}
      >
        {/* Animated gold liquid background for #1 */}
        {isFirst && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-2xl">
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.25) 0%, rgba(255,165,0,0.15) 50%, rgba(255,215,0,0.25) 100%)' }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[60%]"
              style={{ background: 'linear-gradient(0deg, rgba(255,215,0,0.4) 0%, rgba(255,165,0,0.2) 40%, transparent 100%)' }}
              animate={{ y: [0, -4, 2, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[40%]"
              style={{ background: 'linear-gradient(0deg, rgba(255,236,139,0.3) 0%, transparent 100%)' }}
              animate={{ y: [2, -3, 1, -1, 2], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

        <Trophy className={`w-6 h-6 relative z-10 ${isFirst ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]' : 'text-amber-400'}`} />
        <div className="flex flex-col items-start relative z-10">
          <span className="text-lg font-black leading-tight" style={{ color: isFirst ? '#FFD700' : '#D6FF03' }}>#{displayRank || '—'}</span>
          <span className={`text-[10px] font-medium ${isFirst ? 'text-amber-300' : 'text-slate-400'}`}>Leaderboard</span>
        </div>
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}

      {/* Slide-out panel */}
      <div className={`fixed left-0 top-0 h-full w-80 sm:w-96 bg-slate-900 border-r border-slate-700 z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Monthly Leaderboard</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* My position summary */}
          {myStats && (
            <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Your Position</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold" style={{ color: '#D6FF03' }}>#{myRank}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{myStats.booked} booked</p>
                  {myStats.avgSTL != null && <p className="text-[10px] text-slate-400">{myStats.avgSTL}m avg STL</p>}
                </div>
                {rankChange !== null && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${rankChange > 0 ? 'text-green-400' : rankChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {rankChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : rankChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    {rankChange > 0 ? `+${rankChange}` : rankChange < 0 ? rankChange : '—'}
                    <span className="text-[10px] text-slate-500 ml-0.5">vs last mo</span>
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
            <div className="space-y-1">
              {leaderboard.map((s, i) => {
                const isMe = s.id === user.id;
                const lastEntry = lastMonthBoard.find(ls => ls.id === s.id);
                const lastPos = lastEntry ? lastMonthBoard.indexOf(lastEntry) + 1 : null;
                const posChange = lastPos ? lastPos - (i + 1) : null;
                return (
                  <div key={s.id} className={`flex items-center justify-between py-2 px-2 rounded-md ${isMe ? 'bg-slate-800 border border-slate-700' : ''}`}>
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
              })}
            </div>
          </div>

          {/* Spiffs & Bonuses */}
          {mySpiffs.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5 mb-2">
                <Gift className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Active Spiffs & Bonuses</p>
              </div>
              <div className="space-y-2">
                {mySpiffs.map(sp => {
                  const progress = getSpiffProgress(sp);
                  const isSTL = sp.qualifier === 'stl';
                  // For STL, goal is met when avg STL <= goal_value (lower is better)
                  const pct = isSTL
                    ? (progress != null && sp.goal_value > 0 ? Math.min((sp.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
                    : (sp.goal_value > 0 ? Math.min((progress / sp.goal_value) * 100, 100) : 0);
                  const met = isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);

                  return (
                    <div key={sp.id} className="bg-slate-800 rounded-lg border border-slate-700/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-white">{sp.title}</p>
                        {sp.reward && <span className="text-[10px] font-bold text-purple-400">{sp.reward}</span>}
                      </div>
                      {sp.description && <p className="text-[10px] text-slate-500 mb-1.5">{sp.description}</p>}
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-400">
                          {isSTL ? `${progress ?? '—'}m avg` : `${progress} / ${sp.goal_value}`}
                          {isSTL ? ` (goal: ≤${sp.goal_value}m)` : ` ${sp.qualifier}`}
                        </span>
                        {sp.due_date && (
                          <span className="text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(sp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full">
                        <div className={`h-1.5 rounded-full transition-all ${met ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      {met && <p className="text-[10px] text-green-400 font-medium mt-1">Goal met!</p>}
                    </div>
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