import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, ListChecks, History, Check, X, Clock, Play } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  in_progress: { label: 'In Progress', icon: Play, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  done: { label: 'Done', icon: Check, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  dismissed: { label: 'Dismissed', icon: X, bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300' },
};

export default function AIRecapPanel({ clientMetrics, leads, spendRecords }) {
  const queryClient = useQueryClient();
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [showHistory, setShowHistory] = useState(false);

  // Fetch existing task logs (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: taskLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['ai-task-logs'],
    queryFn: () => base44.entities.AITaskLog.list('-created_date', 200),
  });

  const recentLogs = taskLogs.filter(l => new Date(l.created_date) >= fourteenDaysAgo);
  const activeTasks = taskLogs.filter(l => l.status === 'pending' || l.status === 'in_progress');
  const completedTasks = taskLogs.filter(l => l.status === 'done' || l.status === 'dismissed');

  const generateRecap = async () => {
    if (clientMetrics.length === 0) return;
    setLoading(true);

    const summaryData = clientMetrics.slice(0, 30).map(c => ({
      name: c.name,
      spend7d: c.spend7d,
      leads7d: c.leads7d,
      appts7d: c.appts7d,
      cpa7d: c.cpa7d === Infinity ? null : c.cpa7d?.toFixed(0),
      avgSTL: c.stl?.toFixed(0) || null,
      showRate: c.showRate7d,
      alerts: c.alerts,
    }));

    const totalSpend = clientMetrics.reduce((s, c) => s + c.spend7d, 0);
    const totalAppts = clientMetrics.reduce((s, c) => s + c.appts7d, 0);
    const alertClients = clientMetrics.filter(c => c.alerts.length > 0);

    // Build context from recent task history
    const recentTaskContext = recentLogs.map(l => ({
      task: l.task_text,
      type: l.type,
      status: l.status,
      client_id: l.client_id,
      date: l.created_date?.split('T')[0],
      notes: l.notes || null,
    }));

    const prompt = `You are a marketing agency performance analyst. Based on the following 7-day performance data for ${clientMetrics.length} clients, give a concise daily recap and a prioritized task list.

OVERALL: $${totalSpend} spend, ${totalAppts} appts set, ${alertClients.length} clients with alerts.

CLIENT DATA (top 30):
${JSON.stringify(summaryData, null, 1)}

IMPORTANT - RECENT TASK HISTORY (last 14 days):
The following tasks and insights were previously generated. DO NOT repeat tasks that are still "pending" or "in_progress" — they are already being worked on. For "done" tasks, you may suggest follow-ups if relevant. For "dismissed" tasks, do not suggest similar tasks unless circumstances have clearly changed. Marketing changes can take days or weeks to take effect, so avoid recommending the same optimization repeatedly.

${recentTaskContext.length > 0 ? JSON.stringify(recentTaskContext, null, 1) : 'No previous tasks logged.'}

Provide:
1. "recap": A brief 3-5 bullet point summary of overall portfolio health, notable wins, and concerns (plain text, each bullet on its own line starting with •). Reference progress on active tasks where relevant.
2. "tasks": A list of 3-6 NEW specific actionable tasks for today, prioritized by urgency. Each task should reference a specific client name and be actionable. DO NOT duplicate any active/pending tasks. Only suggest genuinely new actions.
3. "task_client_ids": For each task, provide the client name it relates to (or "portfolio" if it's a general task). This should be an array with the same length as "tasks".`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recap: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
          task_client_ids: { type: "array", items: { type: "string" } }
        }
      }
    });

    setRecap(result.recap);

    // Persist new tasks to AITaskLog
    if (result.tasks && result.tasks.length > 0) {
      const clientMap = {};
      clientMetrics.forEach(c => { clientMap[c.name.toLowerCase()] = c.id; });

      const newLogs = result.tasks.map((task, i) => {
        const clientName = result.task_client_ids?.[i] || 'portfolio';
        const matchedClientId = clientMap[clientName.toLowerCase()] || null;
        return {
          task_text: task,
          type: 'task',
          status: 'pending',
          client_id: matchedClientId,
          generated_date: new Date().toISOString(),
        };
      });

      // Also persist recap as insight
      const insightLog = {
        task_text: result.recap,
        type: 'insight',
        status: 'done',
        client_id: null,
        generated_date: new Date().toISOString(),
      };

      await base44.entities.AITaskLog.bulkCreate([insightLog, ...newLogs]);
      refetchLogs();
    }

    setLoading(false);
  };

  useEffect(() => {
    if (clientMetrics.length > 0 && !recap && !loading) {
      generateRecap();
    }
  }, [clientMetrics.length]);

  const updateTaskStatus = async (taskId, newStatus) => {
    await base44.entities.AITaskLog.update(taskId, { status: newStatus });
    refetchLogs();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200">
        <button
          onClick={() => setTab('tasks')}
          className={`flex-1 px-2 py-2.5 text-xs font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
            tab === 'tasks' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" /> Tasks
          {activeTasks.length > 0 && (
            <span className="ml-0.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{activeTasks.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('recap')}
          className={`flex-1 px-2 py-2.5 text-xs font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
            tab === 'recap' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Recap
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 px-2 py-2.5 text-xs font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
            tab === 'history' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Log
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading && tab !== 'history' ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs">Analyzing {clientMetrics.length} clients...</span>
          </div>
        ) : tab === 'recap' ? (
          <div className="space-y-2">
            {recap ? (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{recap}</div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">No data to analyze yet</p>
            )}
          </div>
        ) : tab === 'tasks' ? (
          <div className="space-y-1.5">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                />
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">
                {loading ? 'Generating tasks...' : 'No active tasks. Hit refresh to generate.'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {completedTasks.length > 0 ? (
              completedTasks.slice(0, 30).map((task) => (
                <div key={task.id} className={`p-2 rounded-md ${STATUS_CONFIG[task.status]?.bg || 'bg-gray-50'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${STATUS_CONFIG[task.status]?.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${task.type === 'insight' ? 'text-gray-500 whitespace-pre-wrap' : STATUS_CONFIG[task.status]?.text}`}>
                        {task.type === 'insight' ? '📊 Recap' : task.task_text}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(task.created_date).toLocaleDateString()} · {task.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">No history yet</p>
            )}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-100">
        <button
          onClick={generateRecap}
          disabled={loading}
          className="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Generate New Recap & Tasks
        </button>
      </div>
    </div>
  );
}

function TaskItem({ task, onStatusChange }) {
  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  const nextStatuses = task.status === 'pending'
    ? ['in_progress', 'done', 'dismissed']
    : task.status === 'in_progress'
    ? ['done', 'dismissed']
    : [];

  return (
    <div className={`p-2 rounded-md ${config.bg} transition-all`}>
      <div className="flex items-start gap-2">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-relaxed ${config.text}`}>{task.task_text}</p>
          <div className="flex items-center gap-1 mt-1.5">
            {nextStatuses.map(s => {
              const sc = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(task.id, s)}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded border transition-colors ${sc.text} border-current/20 hover:opacity-80`}
                >
                  <sc.icon className="w-2.5 h-2.5" /> {sc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}