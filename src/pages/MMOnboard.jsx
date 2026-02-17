import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardCheck, ArrowLeft, Check, Play, Circle } from 'lucide-react';

export default function MMOnboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'marketing_manager' && currentUser.app_role !== 'admin') {
          navigate(createPageUrl('SetterDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: allProjects = [] } = useQuery({
    queryKey: ['mm-onboard-projects'],
    queryFn: () => base44.entities.OnboardProject.filter({ status: 'in_progress' }),
  });

  const { data: allTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['mm-onboard-tasks'],
    queryFn: () => base44.entities.OnboardTask.list('-created_date', 1000),
  });

  const { data: allProjectsFull = [] } = useQuery({
    queryKey: ['mm-onboard-projects-all'],
    queryFn: () => base44.entities.OnboardProject.list('-created_date', 200),
  });

  if (!user) return null;

  // Filter to projects assigned to this MM (or all if admin)
  const myProjects = user.app_role === 'admin'
    ? allProjects
    : allProjects.filter(p => p.assigned_mm_id === user.id);

  // Get MM tasks for these projects
  const myTasks = allTasks.filter(t =>
    t.assigned_to === 'marketing_manager' &&
    myProjects.some(p => p.id === t.project_id)
  );

  const pendingTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const updateTaskStatus = async (taskId, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completed_date = new Date().toISOString();
      updates.completed_by = user.id;
    }
    await base44.entities.OnboardTask.update(taskId, updates);

    // Check if all tasks for the project are done
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      const projectTasks = allTasks.filter(t => t.project_id === task.project_id);
      const updatedProjectTasks = projectTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      if (updatedProjectTasks.every(t => t.status === 'completed')) {
        await base44.entities.OnboardProject.update(task.project_id, {
          status: 'completed',
          completed_date: new Date().toISOString(),
        });
      }
    }

    refetchTasks();
  };

  const getProjectName = (projectId) => {
    const p = allProjectsFull.find(p => p.id === projectId);
    return p?.client_name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(createPageUrl('MMDashboard'))} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <ClipboardCheck className="w-5 h-5" style={{color:'#D6FF03'}} />
              <h1 className="text-base font-bold text-white">My Onboarding Tasks</h1>
            </div>
            <span className="text-xs text-slate-400">{user?.full_name}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Pending tasks */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">
            Action Required ({pendingTasks.length})
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 text-center text-xs text-slate-500">
              No pending onboarding tasks assigned to you.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(task => (
                <div key={task.id} className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-full ${task.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {task.status === 'in_progress' ? <Play className="w-3 h-3 text-blue-600" /> : <Circle className="w-3 h-3 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                      <p className="text-[10px] text-indigo-600 font-medium mt-1">Client: {getProjectName(task.project_id)}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-2 py-1 text-[10px] font-medium rounded border border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="px-2 py-1 text-[10px] font-medium rounded border border-green-300 text-green-600 hover:bg-green-50"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3">Completed ({completedTasks.length})</h2>
            <div className="space-y-1.5">
              {completedTasks.slice(0, 20).map(task => (
                <div key={task.id} className="bg-green-50/50 rounded-lg border border-green-200 p-2.5">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-green-700 line-through">{task.title}</p>
                      <p className="text-[10px] text-gray-400">{getProjectName(task.project_id)} · {task.completed_date ? new Date(task.completed_date).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}