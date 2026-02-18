import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Snowflake } from 'lucide-react';

export default function DailySpiffBanner({ spiffs, leads, user }) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Find daily spiffs relevant to this user
  const dailySpiffs = (spiffs || []).filter(sp => {
    if (!sp.is_daily || sp.status === 'expired') return false;
    if (sp.due_date && sp.due_date !== today && sp.status === 'active') return false;
    if (sp.scope === 'individual') return sp.assigned_setter_id === user?.id;
    return true;
  });

  if (dailySpiffs.length === 0) return null;

  // Check if any daily spiff is met today
  const getDailyProgress = (spiff) => {
    if (spiff.qualifier === 'appointments') {
      if (spiff.scope === 'team_company') {
        return leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= dayStart).length;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user?.id;
      return leads.filter(l => l.booked_by_setter_id === setterId && l.date_appointment_set && new Date(l.date_appointment_set) >= dayStart).length;
    }
    if (spiff.qualifier === 'stl') {
      if (spiff.scope === 'team_company') {
        const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= dayStart);
        return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user?.id;
      const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && new Date(l.created_date) >= dayStart);
      return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
    }
    return 0;
  };

  // Check if ALL daily spiffs are met
  const allMet = dailySpiffs.every(sp => {
    if (sp.status === 'completed') return true;
    const progress = getDailyProgress(sp);
    const isSTL = sp.qualifier === 'stl';
    return isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);
  });

  if (allMet) {
    // ICED OUT frozen text
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Snowflake className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
        </motion.div>
        <motion.span
          className="text-lg sm:text-xl font-black uppercase tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #e0f7fa 0%, #67e8f9 25%, #ffffff 50%, #a5f3fc 75%, #22d3ee 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(103,232,249,0.5)) drop-shadow(0 0 16px rgba(34,211,238,0.3))',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          Daily Spiff Met
        </motion.span>
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <Snowflake className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(103,232,249,0.5)]" />
        </motion.div>
      </motion.div>
    );
  }

  // BLAZING fire text
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <Flame className="w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(255,100,0,0.7)]" />
      </motion.div>
      <motion.span
        className="text-lg sm:text-xl font-black uppercase tracking-wide"
        style={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #ffaa00 25%, #fff176 50%, #ffaa00 75%, #ff6b35 100%)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 6px rgba(255,107,53,0.5)) drop-shadow(0 0 12px rgba(255,170,0,0.3))',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        New Daily Spiff
      </motion.span>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
      >
        <Flame className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,170,0,0.5)]" />
      </motion.div>
    </motion.div>
  );
}