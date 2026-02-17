import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, Circle, ArrowRight, Trash2, Flame, Clock,
  ChevronDown, Sparkles, GripVertical
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high: { label: 'High', icon: Flame, gradient: 'from-red-500 to-orange-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { label: 'Med', icon: Clock, gradient: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { label: 'Low', icon: Circle, gradient: 'from-blue-400 to-cyan-400', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-400' },
};

const COLUMNS = [
  { key: 'todo', label: 'To Do', emoji: '📋', gradient: 'from-slate-600 to-slate-800' },
  { key: 'in_progress', label: 'In Progress', emoji: '⚡', gradient: 'from-blue-600 to-indigo-600' },
  { key: 'done', label: 'Done', emoji: '✅', gradient: 'from-emerald-600 to-green-600' },
];

export default function MMTaskBoard({ clients = [] }) {
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newClient, setNewClient] = useState('');
  const [newDue, setNewDue] = useState('');

  const { data: tasks = [] } = useQuery({
    queryKey: ['mm-tasks'],
    queryFn: () => base44.entities.MMTask.list('-created_date', 200),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mm-tasks'] });

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await base44.entities.MMTask.create({
      title: newTitle.trim(),
      status: addingTo,
      priority: newPriority,
      client_id: newClient || undefined,
      due_date: newDue || undefined,
    });
    setNewTitle('');
    setNewPriority('medium');
    setNewClient('');
    setNewDue('');
    setAddingTo(null);
    refresh();
  };

  const moveTask = async (task, newStatus) => {
    await base44.entities.MMTask.update(task.id, { status: newStatus });
    refresh();
  };

  const deleteTask = async (taskId) => {
    await base44.entities.MMTask.delete(taskId);
    refresh();
  };

  const cyclePriority = async (task) => {
    const order = ['low', 'medium', 'high'];
    const next = order[(order.indexOf(task.priority || 'medium') + 1) % 3];
    await base44.entities.MMTask.update(task.id, { priority: next });
    refresh();
  };

  const getClientName = (id) => clients.find(c => c.id === id)?.name || null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/80" />
            <h3 className="text-sm font-bold text-white tracking-wide">My Tasks</h3>
          </div>
          <span className="text-[10px] font-semibold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
            {tasks.filter(t => t.status !== 'done').length} active
          </span>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{col.emoji}</span>
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{col.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${col.gradient} text-white`}>
                    {colTasks.length}
                  </span>
                </div>
                {col.key !== 'done' && (
                  <button
                    onClick={() => setAddingTo(addingTo === col.key ? null : col.key)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add task form */}
              <AnimatePresence>
                {addingTo === col.key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-1.5 p-2 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg space-y-1.5">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAddingTo(null); }}
                      />
                      <div className="flex gap-1.5">
                        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="flex-1 px-2 py-1 text-[10px] border border-gray-300 rounded-md bg-white">
                          <option value="low">🔵 Low</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="high">🔴 High</option>
                        </select>
                        <select value={newClient} onChange={(e) => setNewClient(e.target.value)} className="flex-1 px-2 py-1 text-[10px] border border-gray-300 rounded-md bg-white">
                          <option value="">No client</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <input
                        type="date"
                        value={newDue}
                        onChange={(e) => setNewDue(e.target.value)}
                        className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md bg-white"
                      />
                      <div className="flex gap-1">
                        <button onClick={addTask} className="flex-1 px-2 py-1.5 text-[10px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm">
                          Add Task
                        </button>
                        <button onClick={() => setAddingTo(null)} className="px-2 py-1.5 text-[10px] font-medium bg-white text-gray-500 rounded-md border border-gray-200 hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tasks */}
              <div className="space-y-1 mb-2">
                <AnimatePresence>
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      column={col.key}
                      clientName={getClientName(task.client_id)}
                      onMove={moveTask}
                      onDelete={deleteTask}
                      onCyclePriority={cyclePriority}
                    />
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <p className="text-[10px] text-gray-300 text-center py-2 italic">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, column, clientName, onMove, onDelete, onCyclePriority }) {
  const pri = PRIORITY_CONFIG[task.priority || 'medium'];
  const isOverdue = task.due_date && new Date(task.due_date + 'T23:59:59') < new Date() && column !== 'done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: 50 }}
      transition={{ duration: 0.2 }}
      className={`group relative p-2 rounded-lg border transition-all hover:shadow-md ${
        column === 'done'
          ? 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
          : isOverdue
          ? 'bg-red-50 border-red-300 shadow-sm shadow-red-100'
          : `bg-white ${pri.border} shadow-sm`
      }`}
    >
      <div className="flex items-start gap-1.5">
        {/* Priority dot — click to cycle */}
        <button
          onClick={() => onCyclePriority(task)}
          className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${pri.dot} hover:ring-2 hover:ring-offset-1 hover:ring-${task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'blue'}-300 transition-all`}
          title={`Priority: ${pri.label} (click to change)`}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-tight ${column === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {clientName && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {clientName}
              </span>
            )}
            {task.due_date && (
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                isOverdue ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-500'
              }`}>
                {isOverdue ? '⚠ ' : ''}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — appear on hover */}
      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-md border border-gray-200 shadow-sm px-0.5 py-0.5">
        {column === 'todo' && (
          <button onClick={() => onMove(task, 'in_progress')} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Start">
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        {column === 'in_progress' && (
          <button onClick={() => onMove(task, 'done')} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Complete">
            <Check className="w-3 h-3" />
          </button>
        )}
        {column === 'done' && (
          <button onClick={() => onMove(task, 'todo')} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Reopen">
            <Circle className="w-3 h-3" />
          </button>
        )}
        <button onClick={() => onDelete(task.id)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}