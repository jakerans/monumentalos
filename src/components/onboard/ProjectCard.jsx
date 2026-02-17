import React from 'react';
import { CheckCircle, Clock, PauseCircle } from 'lucide-react';

const statusConfig = {
  in_progress: { label: 'In Progress', icon: Clock, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  on_hold: { label: 'On Hold', icon: PauseCircle, bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export default function ProjectCard({ project, tasks, mmUsers, onClick }) {
  const config = statusConfig[project.status] || statusConfig.in_progress;
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const completedCount = projectTasks.filter(t => t.status === 'completed').length;
  const totalCount = projectTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const mm = mmUsers.find(u => u.id === project.assigned_mm_id);
  const daysElapsed = Math.floor((new Date() - new Date(project.started_date || project.created_date)) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{project.client_name}</h3>
          <p className="text-xs text-gray-400">{project.template_name}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${config.bg} ${config.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>{completedCount}/{totalCount} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{mm ? `MM: ${mm.full_name}` : 'No MM assigned'}</span>
        <span>{daysElapsed}d elapsed</span>
      </div>
    </div>
  );
}