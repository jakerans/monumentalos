import React from 'react';
import { Phone, Clock, Calendar, CheckCircle } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

export default function SetterStats({ newCount, inProgressCount, bookedCount, todayCount }) {
  const stats = [
    { label: 'New', count: newCount, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    { label: 'In Progress', count: inProgressCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24' },
    { label: 'Booked', count: bookedCount, icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399' },
    { label: "Today's Appts", count: todayCount, icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {stats.map((s, i) => (
        <SparklineCard
          key={s.label}
          index={i}
          label={s.label}
          value={s.count}
          icon={s.icon}
          iconBg={s.bg}
          iconColor={s.color}
          sparkColor={s.spark}
        />
      ))}
    </div>
  );
}