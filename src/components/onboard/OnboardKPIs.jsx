import React, { useMemo } from 'react';
import { Clock, CheckCircle, PlayCircle, BarChart3 } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

export default function OnboardKPIs({ projects, tasks, precomputed }) {
  const stats = useMemo(() => {
    // Use precomputed KPIs from backend if available
    if (precomputed) return precomputed;

    const active = projects.filter(p => p.status === 'in_progress');
    const completed = projects.filter(p => p.status === 'completed');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentCompleted = completed.filter(p => p.completed_date && new Date(p.completed_date) >= ninetyDaysAgo);

    let avgDays = null;
    if (recentCompleted.length > 0) {
      const totalDays = recentCompleted.reduce((sum, p) => {
        const start = new Date(p.started_date || p.created_date);
        const end = new Date(p.completed_date);
        return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = (totalDays / recentCompleted.length).toFixed(1);
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

    return { activeCount: active.length, completedCount: completed.length, avgDays, pendingTaskCount: pendingTasks.length };
  }, [projects, tasks, precomputed]);

  const cards = [
    { label: 'Active Projects', value: stats.activeCount, icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    { label: 'Completed', value: stats.completedCount, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399' },
    { label: 'Avg Days to Launch', value: stats.avgDays ?? '—', subtitle: 'Last 90 days', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24' },
    { label: 'Open Tasks', value: stats.pendingTaskCount, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <SparklineCard
          key={c.label}
          index={i}
          label={c.label}
          value={c.value}
          subtitle={c.subtitle}
          icon={c.icon}
          iconBg={c.bg}
          iconColor={c.color}
          sparkColor={c.spark}
        />
      ))}
    </div>
  );
}