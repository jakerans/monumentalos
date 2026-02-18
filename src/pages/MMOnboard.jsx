import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardCheck, ArrowLeft, Check, Play, Circle, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="space-y-2.5">
              <AnimatePresence>
              {pendingTasks.map((task, i) => {
                const isActive = task.status === 'in_progress';
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500/[0.07] border-blue-500/30 shadow-[0_0_16px_rgba(59,130,246,0.08)]'
                        : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-blue-500"
                        layoutId="active-bar"
                        style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
                      />
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${
                        isActive ? 'bg-blue-500/20' : 'bg-slate-700/60'
                      }`}>
                        {isActive
                          ? <Play className="w-3.5 h-3.5 text-blue-400" />
                          : <Circle className="w-3.5 h-3.5 text-slate-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white leading-tight">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                            <User className="w-2.5 h-2.5 text-indigo-400" />
                            <span className="text-[10px] font-medium text-indigo-300">{getProjectName(task.project_id)}</span>
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-medium text-blue-400 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3">Completed ({completedTasks.length})</h2>
            <div className="space-y-1.5">
              {completedTasks.slice(0, 20).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="bg-emerald-500/[0.04] rounded-lg border border-emerald-500/15 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500/15 flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 line-through">{task.title}</p>
                      <p className="text-[10px] text-slate-600">{getProjectName(task.project_id)}{task.completed_date ? ` · ${new Date(task.completed_date).toLocaleDateString()}` : ''}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}