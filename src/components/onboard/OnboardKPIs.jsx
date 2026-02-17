import React, { useMemo } from 'react';
import { Clock, CheckCircle, PlayCircle, BarChart3 } from 'lucide-react';

export default function OnboardKPIs({ projects, tasks }) {
  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'in_progress');
    const completed = projects.filter(p => p.status === 'completed');

    // Avg days from start to completion (last 90 days)
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

    // Pending tasks across all active projects
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

    return {
      activeCount: active.length,
      completedCount: completed.length,
      avgDays,
      pendingTaskCount: pendingTasks.length,
    };
  }, [projects, tasks]);

  const cards = [
    { label: 'Active Projects', value: stats.activeCount, icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: stats.completedCount, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Days to Launch', value: stats.avgDays ?? '—', sub: 'Last 90 days', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Open Tasks', value: stats.pendingTaskCount, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-md ${c.bg}`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <span className="text-xs text-slate-400 font-medium">{c.label}</span>
          </div>
          <p className="text-xl font-bold text-white">{c.value}</p>
          {c.sub && <p className="text-[10px] text-slate-500">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}