import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

  // Filter to active, non-expired/missed spiffs only for main page
  const mySpiffs = spiffs.filter(sp => {
    if (sp.status !== 'active') return false;
    if (sp.scope === 'individual') return sp.assigned_setter_id === user?.id;
    return true;
  }).filter(sp => {
    // Hide missed/expired spiffs (past due and not met)
    if (!sp.due_date) return true;
    const dueDate = new Date(sp.due_date + 'T23:59:59');
    if (dueDate < now) {
      const progress = getProgress(sp);
      const isSTL = sp.qualifier === 'stl';
      const met = isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);
      return met; // Keep only if goal was met
    }
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

  if (mySpiffs.length === 0) return null;

  const sp = mySpiffs[activeIndex] || mySpiffs[0];
  const progress = getProgress(sp);
  const isSTL = sp.qualifier === 'stl';
  const pct = isSTL
    ? (progress != null && sp.goal_value > 0 ? Math.min((sp.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
    : (sp.goal_value > 0 ? Math.min((progress / sp.goal_value) * 100, 100) : 0);
  const met = isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);

  return (
    <div className="relative h-full flex flex-col">
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

      {/* Dot indicators */}
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
    </div>
  );
}