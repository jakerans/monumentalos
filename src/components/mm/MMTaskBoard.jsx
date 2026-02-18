import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimate } from 'framer-motion';
import {
  Plus, Check, Circle, ArrowRight, Trash2, Flame, Clock,
  Sparkles, GripVertical
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high: { label: 'High', dot: 'bg-red-500', ring: 'ring-red-400/40' },
  medium: { label: 'Med', dot: 'bg-amber-500', ring: 'ring-amber-400/40' },
  low: { label: 'Low', dot: 'bg-blue-400', ring: 'ring-blue-400/40' },
};

const COLUMNS = [
  { key: 'todo', label: 'To Do', emoji: '📋', gradient: 'from-slate-500 to-slate-700', dropBg: 'bg-slate-500/10', dropBorder: 'border-slate-400/40' },
  { key: 'in_progress', label: 'In Progress', emoji: '⚡', gradient: 'from-blue-500 to-indigo-600', dropBg: 'bg-blue-500/10', dropBorder: 'border-blue-400/40' },
  { key: 'done', label: 'Done', emoji: '✅', gradient: 'from-emerald-500 to-green-600', dropBg: 'bg-emerald-500/10', dropBorder: 'border-emerald-400/40' },
];

export default function MMTaskBoard({ clients = [] }) {
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newClient, setNewClient] = useState('');
  const [newDue, setNewDue] = useState('');
  const [dragOverCol, setDragOverCol] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);
  const columnRefs = useRef({});

  const { data: tasks = [] } = useQuery({
    queryKey: ['mm-tasks'],
    queryFn: () => base44.entities.MMTask.list('-created_date', 200),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mm-tasks'] });

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await base44.entities.MMTask.create({
      title: newTitle.trim(), status: addingTo, priority: newPriority,
      client_id: newClient || undefined, due_date: newDue || undefined,
    });
    setNewTitle(''); setNewPriority('medium'); setNewClient(''); setNewDue(''); setAddingTo(null);
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

  const handleDragEnd = useCallback((task, info) => {
    setDraggingTask(null);
    setDragOverCol(null);
    // Determine which column the card was dropped into
    const dropX = info.point.x;
    const dropY = info.point.y;
    let targetCol = null;
    for (const col of COLUMNS) {
      const el = columnRefs.current[col.key];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom) {
        targetCol = col.key;
        break;
      }
    }
    if (targetCol && targetCol !== task.status) {
      moveTask(task, targetCol);
    }
  }, []);

  const handleDrag = useCallback((task, info) => {
    const dropX = info.point.x;
    const dropY = info.point.y;
    let found = null;
    for (const col of COLUMNS) {
      const el = columnRefs.current[col.key];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom) {
        found = col.key;
        break;
      }
    }
    setDragOverCol(found);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
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
          const isOver = dragOverCol === col.key && draggingTask?.status !== col.key;
          return (
            <div key={col.key} ref={(el) => { columnRefs.current[col.key] = el; }}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{col.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{col.label}</span>
                  <motion.span
                    key={colTasks.length}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${col.gradient} text-white`}
                  >
                    {colTasks.length}
                  </motion.span>
                </div>
                {col.key !== 'done' && (
                  <button onClick={() => setAddingTo(addingTo === col.key ? null : col.key)} className="text-slate-500 hover:text-[#D6FF03] transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Drop zone highlight */}
              <motion.div
                animate={{
                  borderColor: isOver ? 'rgba(214,255,3,0.5)' : 'transparent',
                  backgroundColor: isOver ? 'rgba(214,255,3,0.04)' : 'transparent',
                }}
                transition={{ duration: 0.15 }}
                className="rounded-lg border-2 border-dashed min-h-[32px] transition-colors"
              >
                {/* Add task form */}
                <AnimatePresence>
                  {addingTo === col.key && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mb-1.5 p-2 bg-slate-900/60 border border-slate-600 rounded-lg space-y-1.5">
                        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="What needs to be done?"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
                          autoFocus onKeyDown={(e) => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAddingTo(null); }}
                        />
                        <div className="flex gap-1.5">
                          <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="flex-1 px-2 py-1 text-[10px] border border-slate-600 rounded-md bg-slate-800 text-slate-300">
                            <option value="low">🔵 Low</option><option value="medium">🟡 Medium</option><option value="high">🔴 High</option>
                          </select>
                          <select value={newClient} onChange={(e) => setNewClient(e.target.value)} className="flex-1 px-2 py-1 text-[10px] border border-slate-600 rounded-md bg-slate-800 text-slate-300">
                            <option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="w-full px-2 py-1 text-[10px] border border-slate-600 rounded-md bg-slate-800 text-slate-300" />
                        <div className="flex gap-1">
                          <button onClick={addTask} className="flex-1 px-2 py-1.5 text-[10px] font-bold text-black rounded-md hover:opacity-90 shadow-sm" style={{ backgroundColor: '#D6FF03' }}>Add Task</button>
                          <button onClick={() => setAddingTo(null)} className="px-2 py-1.5 text-[10px] font-medium text-slate-400 rounded-md border border-slate-600 hover:bg-slate-700">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tasks */}
                <div className="space-y-1 mb-1">
                  <AnimatePresence mode="popLayout">
                    {colTasks.map(task => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        column={col.key}
                        clientName={getClientName(task.client_id)}
                        onMove={moveTask}
                        onDelete={deleteTask}
                        onCyclePriority={cyclePriority}
                        onDragStart={() => setDraggingTask(task)}
                        onDrag={(info) => handleDrag(task, info)}
                        onDragEnd={(info) => handleDragEnd(task, info)}
                      />
                    ))}
                  </AnimatePresence>
                  {colTasks.length === 0 && !isOver && (
                    <p className="text-[10px] text-slate-600 text-center py-2 italic">
                      {draggingTask ? 'Drop here' : 'No tasks'}
                    </p>
                  )}
                  {isOver && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 32 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-md border-2 border-dashed border-[#D6FF03]/40 bg-[#D6FF03]/5 flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-[#D6FF03]/60">Drop here</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task, column, clientName, onMove, onDelete, onCyclePriority, onDragStart, onDrag, onDragEnd }) {
  const pri = PRIORITY_CONFIG[task.priority || 'medium'];
  const isOverdue = task.due_date && new Date(task.due_date + 'T23:59:59') < new Date() && column !== 'done';
  const y = useMotionValue(0);
  const boxShadow = useTransform(y, [-5, 0, 5], [
    '0 8px 32px rgba(214,255,3,0.15), 0 0 0 1px rgba(214,255,3,0.2)',
    '0 1px 3px rgba(0,0,0,0.1)',
    '0 8px 32px rgba(214,255,3,0.15), 0 0 0 1px rgba(214,255,3,0.2)',
  ]);
  const scale = useTransform(y, [-20, 0, 20], [1.04, 1, 1.04]);

  return (
    <motion.div
      layout
      layoutId={`task-${task.id}`}
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -10, transition: { duration: 0.2 } }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      }}
      drag
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDrag={(_, info) => onDrag(info)}
      onDragEnd={(_, info) => onDragEnd(info)}
      whileDrag={{
        scale: 1.05,
        zIndex: 50,
        boxShadow: '0 12px 40px rgba(214,255,3,0.2), 0 0 0 2px rgba(214,255,3,0.3)',
        cursor: 'grabbing',
        rotate: [-0.5, 0.5],
      }}
      whileHover={{ y: -1 }}
      style={{ y, boxShadow, scale }}
      className={`group relative p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${
        column === 'done'
          ? 'bg-slate-900/40 border-slate-700 opacity-60 hover:opacity-100'
          : isOverdue
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-slate-900/50 border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <motion.div
          className="mt-0.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          whileHover={{ scale: 1.2, color: '#D6FF03' }}
        >
          <GripVertical className="w-3 h-3" />
        </motion.div>

        {/* Priority dot */}
        <motion.button
          onClick={() => onCyclePriority(task)}
          whileHover={{ scale: 1.5 }}
          whileTap={{ scale: 0.8, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${pri.dot} hover:ring-2 ${pri.ring} ring-offset-1 ring-offset-slate-900 transition-shadow`}
          title={`Priority: ${pri.label} (click to change)`}
        />

        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-tight ${column === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {clientName && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                {clientName}
              </span>
            )}
            {task.due_date && (
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                isOverdue ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-slate-400'
              }`}>
                {isOverdue ? '⚠ ' : ''}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-slate-800/90 backdrop-blur-sm rounded-md border border-slate-600 shadow-sm px-0.5 py-0.5">
        {column === 'todo' && (
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }} onClick={() => onMove(task, 'in_progress')} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded" title="Start">
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        )}
        {column === 'in_progress' && (
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }} onClick={() => onMove(task, 'done')} className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="Complete">
            <Check className="w-3 h-3" />
          </motion.button>
        )}
        {column === 'done' && (
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }} onClick={() => onMove(task, 'todo')} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded" title="Reopen">
            <Circle className="w-3 h-3" />
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }} onClick={() => onDelete(task.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="Delete">
          <Trash2 className="w-3 h-3" />
        </motion.button>
      </div>
    </motion.div>
  );
}