import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Gift, Clock, Trophy } from 'lucide-react';
import SpiffCard from './SpiffCard';

export default function SpiffTracker({ spiffs, leads, user }) {
  const now = new Date();
  const [activeIndex, setActiveIndex] = useState(0);

  const getDateRange = (spiff) => {
    if (spiff.is_daily && spiff.due_date) {
      return { rangeStart: new Date(spiff.due_date + 'T00:00:00'), rangeEnd: new Date(spiff.due_date + 'T23:59:59') };
    }
    return { rangeStart: new Date(now.getFullYear(), now.getMonth(), 1), rangeEnd: now };
  };

  const getProgress = (spiff) => {
    const { rangeStart, rangeEnd } = getDateRange(spiff);
    const inRange = (d) => d ? new Date(d) >= rangeStart && new Date(d) <= rangeEnd : false;

    if (spiff.qualifier === 'appointments') {
      if (spiff.scope === 'team_company') {
        return leads.filter(l => inRange(l.date_appointment_set)).length;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user?.id;
      return leads.filter(l => l.booked_by_setter_id === setterId && inRange(l.date_appointment_set)).length;
    }
    if (spiff.qualifier === 'stl') {
      if (spiff.scope === 'team_company') {
        const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && inRange(l.created_date));
        return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user?.id;
      const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && inRange(l.created_date));
      return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
    }
    return 0;
  };

  // Filter to relevant spiffs for this setter — active only (expired/completed hidden from rotation)
  const mySpiffs = spiffs.filter(sp => {
    if (sp.status !== 'active') return false;
    if (sp.scope === 'individual') return sp.assigned_setter_id === user?.id;
    return true;
  }).filter(sp => {
    if (!sp.due_date) return true;
    const dueDate = new Date(sp.due_date + 'T23:59:59');
    if (dueDate < now) {
      const progress = getProgress(sp);
      const isSTL = sp.qualifier === 'stl';
      const met = isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);
      return met;
    }
    return true;
  });

  // Expired/completed spiffs for history display
  const pastSpiffs = spiffs.filter(sp => {
    if (sp.status === 'active') return false;
    if (sp.scope === 'individual') return sp.assigned_setter_id === user?.id;
    return true;
  });

  // Cycle through spiffs
  useEffect(() => {
    if (mySpiffs.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % mySpiffs.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [mySpiffs.length]);

  // Reset index if it goes out of bounds
  useEffect(() => {
    if (activeIndex >= mySpiffs.length) setActiveIndex(0);
  }, [mySpiffs.length, activeIndex]);

  const [showHistory, setShowHistory] = useState(false);

  if (mySpiffs.length === 0 && pastSpiffs.length === 0) return null;

  const sp = mySpiffs.length > 0 ? (mySpiffs[activeIndex] || mySpiffs[0]) : null;
  const progress = sp ? getProgress(sp) : 0;
  const isSTL = sp ? sp.qualifier === 'stl' : false;
  const pct = sp ? (isSTL
    ? (progress != null && sp.goal_value > 0 ? Math.min((sp.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
    : (sp.goal_value > 0 ? Math.min((progress / sp.goal_value) * 100, 100) : 0)) : 0;
  const met = sp ? (isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value)) : false;

  return (
    <div className="relative h-full flex flex-col">
      {sp && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={sp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex-1"
            >
              <SpiffCard spiff={sp} progress={progress} pct={pct} met={met} isSTL={isSTL} />
            </motion.div>
          </AnimatePresence>

          {mySpiffs.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {mySpiffs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-4 h-1.5' : 'w-1.5 h-1.5 opacity-40 hover:opacity-70'
                  }`}
                  style={{ backgroundColor: i === activeIndex ? '#D6FF03' : '#64748b' }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Past Spiffs History Toggle */}
      {pastSpiffs.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors w-full justify-center"
          >
            <Gift className="w-3 h-3" />
            <span>{showHistory ? 'Hide' : 'Show'} Spiff History ({pastSpiffs.length})</span>
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 mt-2">
                  {pastSpiffs.map(ps => {
                    const isExpired = ps.status === 'expired';
                    const isCompleted = ps.status === 'completed';
                    return (
                      <div key={ps.id} className={`relative overflow-hidden rounded-lg ${isExpired ? 'opacity-50' : ''}`}>
                        <div className={`px-3 py-2 rounded-lg border ${
                          isCompleted
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-slate-800/50 border-slate-700/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {isCompleted ? <Trophy className="w-3 h-3 text-green-400" /> : <Gift className="w-3 h-3 text-slate-500" />}
                              <span className={`text-[11px] font-medium ${isCompleted ? 'text-green-400' : 'text-slate-500'}`}>{ps.title}</span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'
                            }`}>
                              {isCompleted ? '✓ Completed' : ps.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-600">
                            {ps.reward && <span>{ps.reward}</span>}
                            {ps.due_date && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(ps.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpired && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-red-500/30 text-lg font-black uppercase tracking-[0.15em] -rotate-12 select-none" style={{ textShadow: '0 0 2px rgba(239,68,68,0.2)' }}>
                              EXPIRED
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}