import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw, ListChecks } from 'lucide-react';

export default function AIRecapPanel({ clientMetrics, leads, spendRecords }) {
  const [recap, setRecap] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('recap');

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

    const prompt = `You are a marketing agency performance analyst. Based on the following 7-day performance data for ${clientMetrics.length} clients, give a concise daily recap and a prioritized task list.

OVERALL: $${totalSpend} spend, ${totalAppts} appts set, ${alertClients.length} clients with alerts.

CLIENT DATA (top 30):
${JSON.stringify(summaryData, null, 1)}

Provide:
1. "recap": A brief 3-5 bullet point summary of overall portfolio health, notable wins, and concerns (plain text, each bullet on its own line starting with •)
2. "tasks": A list of 5-8 specific actionable tasks for today, prioritized by urgency. Each task should reference a specific client name and be actionable. Format each as a short sentence.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recap: { type: "string" },
          tasks: { type: "array", items: { type: "string" } }
        }
      }
    });

    setRecap(result.recap);
    setTasks(result.tasks);
    setLoading(false);
  };

  useEffect(() => {
    if (clientMetrics.length > 0 && !recap && !loading) {
      generateRecap();
    }
  }, [clientMetrics.length]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200">
        <button
          onClick={() => setTab('recap')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            tab === 'recap' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Recap
        </button>
        <button
          onClick={() => setTab('tasks')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            tab === 'tasks' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" /> Today's Tasks
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
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
        ) : (
          <div className="space-y-1.5">
            {tasks && tasks.length > 0 ? (
              tasks.map((task, i) => (
                <TaskItem key={i} index={i + 1} text={task} />
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">No tasks generated yet</p>
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
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
    </div>
  );
}

function TaskItem({ index, text }) {
  const [done, setDone] = useState(false);
  return (
    <div
      onClick={() => setDone(!done)}
      className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-all ${
        done ? 'bg-green-50 opacity-60' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
        done ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'
      }`}>
        {done ? '✓' : index}
      </div>
      <span className={`text-xs leading-relaxed ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{text}</span>
    </div>
  );
}