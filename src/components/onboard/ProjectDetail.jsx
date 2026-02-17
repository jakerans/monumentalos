import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Circle, Play, ArrowLeft, User, Calendar } from 'lucide-react';

const taskStatusConfig = {
  pending: { label: 'Pending', icon: Circle, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-300' },
  in_progress: { label: 'In Progress', icon: Play, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Done', icon: Check, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

export default function ProjectDetail({ project, tasks, mmUsers, onClose, onRefresh }) {
  const [updatingId, setUpdatingId] = useState(null);

  const projectTasks = tasks
    .filter(t => t.project_id === project.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const completedCount = projectTasks.filter(t => t.status === 'completed').length;
  const mm = mmUsers.find(u => u.id === project.assigned_mm_id);

  const updateTaskStatus = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completed_date = new Date().toISOString();
    }
    await base44.entities.OnboardTask.update(taskId, updates);

    // Check if all tasks are done -> mark project completed
    const updatedTasks = projectTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    if (updatedTasks.every(t => t.status === 'completed')) {
      await base44.entities.OnboardProject.update(project.id, {
        status: 'completed',
        completed_date: new Date().toISOString(),
      });
    }

    onRefresh();
    setUpdatingId(null);
  };

  const toggleProjectHold = async () => {
    const newStatus = project.status === 'on_hold' ? 'in_progress' : 'on_hold';
    await base44.entities.OnboardProject.update(project.id, { status: newStatus });
    onRefresh();
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <DialogTitle className="text-lg">{project.client_name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Started {new Date(project.started_date || project.created_date).toLocaleDateString()}</span>
            {mm && <span className="flex items-center gap-1"><User className="w-3 h-3" /> MM: {mm.full_name}</span>}
            <span className="font-medium">{completedCount}/{projectTasks.length} done</span>
          </div>

          {project.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">{project.notes}</p>}

          <button onClick={toggleProjectHold} className="text-xs font-medium text-amber-600 hover:text-amber-700">
            {project.status === 'on_hold' ? 'Resume Project' : 'Put On Hold'}
          </button>

          {/* Tasks */}
          <div className="space-y-1.5">
            {projectTasks.map((task, idx) => {
              const config = taskStatusConfig[task.status] || taskStatusConfig.pending;
              const isUpdating = updatingId === task.id;
              return (
                <div key={task.id} className={`p-2.5 rounded-md border ${task.status === 'completed' ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-400 font-mono mt-0.5 w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${task.status === 'completed' ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.description && <p className="text-[10px] text-gray-400 mt-0.5">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          task.assigned_to === 'marketing_manager' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {task.assigned_to === 'marketing_manager' ? 'MM' : 'Onboard'}
                        </span>
                        {task.status !== 'completed' && (
                          <div className="flex gap-1">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                disabled={isUpdating}
                                className="text-[10px] px-1.5 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              disabled={isUpdating}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-green-300 text-green-600 hover:bg-green-50"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                        {task.completed_date && (
                          <span className="text-[10px] text-gray-400">{new Date(task.completed_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}