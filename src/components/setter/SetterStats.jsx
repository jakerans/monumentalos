import React from 'react';
import { Phone, Clock, Calendar, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SetterStats({ newCount, inProgressCount, bookedCount, todayCount }) {
  const stats = [
    { label: 'New', count: newCount, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'In Progress', count: inProgressCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Booked', count: bookedCount, icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: "Today's Appts", count: todayCount, icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ scale: 1.04, y: -2 }}
          className={`${s.bg} rounded-lg p-3 sm:p-4 border ${s.border} hover:brightness-125 transition-all duration-200`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
            <p className={`text-[10px] sm:text-xs font-medium ${s.color}`}>{s.label}</p>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.count}</p>
        </motion.div>
      ))}
    </div>
  );
}