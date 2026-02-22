import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Check, Circle, Copy, MessageSquare, Minimize2, PartyPopper } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function DailyChecklist({ checklist, log, user, onTaskComplete, onDismiss }) {
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [slackInputs, setSlackInputs] = useState({});
  const [slackMessageGenerated, setSlackMessageGenerated] = useState(false);
  const [slackMessage, setSlackMessage] = useState('');
  const [copiedIcon, setCopiedIcon] = useState(false);

  // Parse tasks and completed list safely
  const tasks = useMemo(() => {
    if (!checklist?.tasks) return [];
    try {
      const parsed = JSON.parse(checklist.tasks);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [checklist?.tasks]);

  const completedIds = useMemo(() => {
    if (!log?.completed_tasks) return [];
    try {
      const parsed = JSON.parse(log.completed_tasks);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [log?.completed_tasks]);

  // Find first uncompleted task index
  const activeTaskIdx = useMemo(() => {
    return tasks.findIndex(t => !completedIds.includes(t.id));
  }, [tasks, completedIds]);

  const activeTask = activeTaskIdx >= 0 ? tasks[activeTaskIdx] : null;
  const allComplete = tasks.length > 0 && completedIds.length === tasks.length;

  // Initialize Slack inputs for current task
  React.useEffect(() => {
    if (activeTask?.slack_fields && activeTask.has_slack_update) {
      setSlackInputs({});
      setSlackMessageGenerated(false);
      setSlackMessage('');
    }
  }, [activeTask?.id]);

  const handleSlackInputChange = (fieldKey, value) => {
    setSlackInputs(prev => ({ ...prev, [fieldKey]: value }));
  };

  const generateSlackMessage = useCallback(() => {
    if (!activeTask?.slack_template) return;
    let msg = activeTask.slack_template;
    Object.entries(slackInputs).forEach(([key, value]) => {
      msg = msg.replace(`{${key}}`, value || '');
    });
    setSlackMessage(msg);
    setSlackMessageGenerated(true);
  }, [activeTask?.slack_template, slackInputs]);

  const handleCopyMessage = useCallback(async () => {
    await navigator.clipboard.writeText(slackMessage);
    setCopiedIcon(true);
    setTimeout(() => setCopiedIcon(false), 2000);
    toast({ title: 'Copied to clipboard', variant: 'success', duration: 2000 });
  }, [slackMessage]);

  const handleCompleteTask = useCallback(() => {
    if (activeTask) {
      onTaskComplete({ task_id: activeTask.id });
    }
  }, [activeTask, onTaskComplete]);

  const isSlackSection = activeTask?.has_slack_update;
  const needsSlackGeneration = isSlackSection && !slackMessageGenerated;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-[#0B0F1A]/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" style={{ color: '#D6FF03' }} />
              <h2 className="text-xl font-bold text-white">Daily Shift Checklist</h2>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-400 mb-3">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium" style={{ color: '#D6FF03' }}>
              {completedIds.length} of {tasks.length} complete
            </span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tasks.length > 0 ? (completedIds.length / tasks.length) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
              className="h-full"
              style={{ backgroundColor: '#D6FF03' }}
            />
          </div>

          {/* Header note */}
          {checklist?.header_note && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-300">{checklist.header_note}</p>
            </div>
          )}
        </div>

        {/* Task list */}
        <div className="max-h-96 overflow-y-auto px-6 py-5 space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, idx) => {
              const isCompleted = completedIds.includes(task.id);
              const isActive = task.id === activeTask?.id;
              const isFuture = !isCompleted && !isActive;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-[#D6FF03]/30 bg-[#D6FF03]/5'
                      : isCompleted
                      ? 'border-slate-700/30 opacity-60'
                      : 'border-slate-700/30 opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          animate={{ boxShadow: ['0 0 0 2px rgba(214, 255, 3, 0.3)', '0 0 0 6px rgba(214, 255, 3, 0.15)'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-5 h-5 rounded-full border-2 border-[#D6FF03]"
                        />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>
                          Task {idx + 1}
                        </span>
                        {task.has_slack_update && (
                          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Slack
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-medium mt-1 ${isCompleted ? 'line-through text-slate-500' : isActive ? 'text-white' : 'text-slate-400'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Action area */}
        <div className="border-t border-slate-700/50 px-6 py-5 bg-slate-800/30">
          {allComplete ? (
            // Completion state
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D6FF03]/10 border-2 border-[#D6FF03] mb-3"
              >
                <PartyPopper className="w-8 h-8" style={{ color: '#D6FF03' }} />
              </motion.div>
              <p className="text-lg font-bold text-white mb-1">All tasks complete!</p>
              <p className="text-sm text-slate-400 mb-4">Great work today!</p>
              <button
                onClick={onDismiss}
                className="w-full px-4 py-2 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#D6FF03' }}
              >
                Close Checklist
              </button>
            </motion.div>
          ) : activeTask ? (
            // Active task action section
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {isSlackSection && (
                <div className="space-y-3 p-3 bg-slate-700/20 border border-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">
                      Post to {activeTask.slack_channel || 'Slack'}
                    </span>
                  </div>

                  {/* Slack input fields */}
                  {activeTask.slack_fields && Array.isArray(activeTask.slack_fields) && (
                    <div className="space-y-2">
                      {activeTask.slack_fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            {field.label}
                          </label>
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={slackInputs[field.key] || ''}
                            onChange={(e) => handleSlackInputChange(field.key, e.target.value)}
                            placeholder={field.placeholder || ''}
                            className="w-full px-2 py-1.5 text-sm border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Generate button */}
                  {!slackMessageGenerated && (
                    <button
                      onClick={generateSlackMessage}
                      className="w-full px-3 py-1.5 text-sm font-medium text-white bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors"
                    >
                      Generate Message
                    </button>
                  )}

                  {/* Message preview */}
                  {slackMessageGenerated && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                        {slackMessage}
                      </div>
                      <button
                        onClick={handleCopyMessage}
                        className="w-full px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        {copiedIcon ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy to Clipboard
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Mark complete button */}
              <button
                onClick={handleCompleteTask}
                disabled={needsSlackGeneration}
                className={`w-full px-4 py-2.5 text-black font-bold rounded-lg transition-all ${
                  needsSlackGeneration ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: '#D6FF03' }}
              >
                Mark Complete
              </button>
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}