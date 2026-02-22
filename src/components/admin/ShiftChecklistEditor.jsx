import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  ClipboardCheck, Plus, Trash2, MessageSquare, Save, Eye, EyeOff,
  ChevronDown, ChevronUp, ArrowUp, ArrowDown, Hash, Loader2, X
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

function newTask() {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    description: '',
    order: 0,
    has_slack_update: false,
    slack_channel: '',
    slack_post_type: 'new_post',
    slack_fields: [],
    slack_template: '',
  };
}

function SlackFieldsEditor({ fields, onChange }) {
  const addField = () => {
    onChange([...fields, { key: `field_${Date.now()}`, label: '', type: 'text' }]);
  };
  const removeField = (idx) => onChange(fields.filter((_, i) => i !== idx));
  const updateField = (idx, patch) => onChange(fields.map((f, i) => i === idx ? { ...f, ...patch } : f));

  return (
    <div className="space-y-2">
      {fields.map((f, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            value={f.label}
            onChange={e => updateField(idx, { label: e.target.value })}
            placeholder="Label"
            className="flex-1 px-2 py-1.5 text-xs border border-slate-600 rounded bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]"
          />
          <input
            value={f.key}
            onChange={e => updateField(idx, { key: e.target.value })}
            placeholder="key"
            className="w-28 px-2 py-1.5 text-xs border border-slate-600 rounded bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03] font-mono"
          />
          <select
            value={f.type}
            onChange={e => updateField(idx, { type: e.target.value })}
            className="w-20 px-2 py-1.5 text-xs border border-slate-600 rounded bg-slate-900 text-white focus:outline-none"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
          </select>
          <button onClick={() => removeField(idx)} className="text-slate-500 hover:text-red-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addField}
        className="flex items-center gap-1 text-xs text-[#D6FF03] hover:opacity-80 transition-opacity"
      >
        <Plus className="w-3.5 h-3.5" /> Add Field
      </button>
    </div>
  );
}

function TaskCard({ task, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(!task.title);

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Collapsed header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50">
        <span className="text-xs font-bold text-slate-500 w-5 text-center">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white truncate block">
            {task.title || <span className="text-slate-500 italic">Untitled task</span>}
          </span>
          {task.description && !expanded && (
            <span className="text-xs text-slate-500 truncate block">{task.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {task.has_slack_update && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-2.5 h-2.5" /> Slack
            </span>
          )}
          <button onClick={() => onMoveUp()} disabled={index === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition-colors">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMoveDown()} disabled={index === total - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition-colors">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1 text-slate-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded edit area */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-slate-800/20 border-t border-slate-700/40 space-y-3">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Title *</label>
            <input
              value={task.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="e.g. HP: Call all new overnight leads"
              className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Description (optional)</label>
            <input
              value={task.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Additional context shown below the title"
              className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdate({ has_slack_update: !task.has_slack_update })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${task.has_slack_update ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${task.has_slack_update ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-slate-300">Has Slack Update step</label>
          </div>

          {task.has_slack_update && (
            <div className="border border-slate-600/50 rounded-lg p-3 bg-slate-900/40 space-y-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Slack Message Generator</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Channel (e.g. #General)</label>
                  <input
                    value={task.slack_channel}
                    onChange={e => onUpdate({ slack_channel: e.target.value })}
                    placeholder="#General"
                    className="w-full px-2 py-1.5 text-xs border border-slate-600 rounded bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Post Type</label>
                  <select
                    value={task.slack_post_type}
                    onChange={e => onUpdate({ slack_post_type: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-600 rounded bg-slate-800 text-white focus:outline-none"
                  >
                    <option value="new_post">New Post</option>
                    <option value="reply">Reply to Standup</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Slack Fields</label>
                <SlackFieldsEditor
                  fields={task.slack_fields || []}
                  onChange={fields => onUpdate({ slack_fields: fields })}
                />
              </div>
              {(task.slack_fields || []).length > 0 && (
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Message Template
                    <span className="ml-2 text-slate-500 normal-case font-normal">
                      Placeholders: {(task.slack_fields || []).map(f => `{${f.key}}`).join(', ')}
                    </span>
                  </label>
                  <textarea
                    value={task.slack_template}
                    onChange={e => onUpdate({ slack_template: e.target.value })}
                    rows={4}
                    placeholder={`e.g. Dial List Complete\nAppts Set: {appts_set}`}
                    className="w-full px-2 py-2 text-xs border border-slate-600 rounded bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03] resize-y font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistPreview({ headerNote, tasks }) {
  return (
    <div className="bg-[#0B0F1A] rounded-lg border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Setter Preview</span>
      </div>
      {headerNote && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-300 leading-relaxed whitespace-pre-wrap">{headerNote}</p>
        </div>
      )}
      <div className="space-y-2">
        {tasks.length === 0 && <p className="text-xs text-slate-600">No tasks added yet.</p>}
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-slate-700/40 bg-slate-800/30">
            <div className="w-5 h-5 rounded border border-slate-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{task.title || <span className="text-slate-500 italic">Untitled</span>}</p>
              {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
              {task.has_slack_update && (
                <div className="flex items-center gap-1 mt-1">
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">
                    Slack update {task.slack_channel ? `→ ${task.slack_channel}` : ''} ({task.slack_post_type === 'reply' ? 'reply to standup' : 'new post'})
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftChecklistEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklistId, setChecklistId] = useState(null);
  const [name, setName] = useState('Default Setter Daily Checklist');
  const [headerNote, setHeaderNote] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    base44.functions.invoke('manageShiftChecklist', { action: 'get_active' })
      .then(res => {
        const cl = res.data?.checklist;
        if (cl) {
          setChecklistId(cl.id);
          setName(cl.name || '');
          setHeaderNote(cl.header_note || '');
          setIsActive(cl.is_active !== false);
          setUpdatedAt(cl.updated_at || null);
          try { setTasks(JSON.parse(cl.tasks || '[]')); } catch { setTasks([]); }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const addTask = () => {
    const t = newTask();
    t.order = tasks.length + 1;
    setTasks(prev => [...prev, t]);
  };

  const updateTask = useCallback((idx, patch) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t));
  }, []);

  const deleteTask = useCallback((idx) => {
    setTasks(prev => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, order: i + 1 })));
  }, []);

  const moveTask = useCallback((idx, dir) => {
    setTasks(prev => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((t, i) => ({ ...t, order: i + 1 }));
    });
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('manageShiftChecklist', {
        action: 'save_template',
        checklist_id: checklistId || undefined,
        name: name.trim(),
        header_note: headerNote,
        tasks: tasks.map((t, i) => ({ ...t, order: i + 1 })),
        is_active: isActive,
      });
      const cl = res.data?.checklist;
      if (cl) {
        setChecklistId(cl.id);
        setUpdatedAt(cl.updated_at || new Date().toISOString());
      }
      toast({ title: 'Checklist saved', description: 'Setters will see the updated checklist next shift.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading checklist...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-[#D6FF03]" />
          <div>
            <h2 className="text-lg font-bold text-white">Daily Shift Checklist Template</h2>
            <p className="text-xs text-slate-400">Configure the daily checklist setters complete each shift</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActive(a => !a)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-[#D6FF03]' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs text-slate-400">{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Checklist Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          placeholder="e.g. Default Setter Daily Checklist"
        />
      </div>

      {/* Header Note */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Header Note <span className="text-slate-500 normal-case font-normal">(displayed above tasks, not checkable)</span>
        </label>
        <p className="text-[11px] text-slate-500 mb-1.5">Use this for persistent reminders like STL procedures</p>
        <textarea
          value={headerNote}
          onChange={e => setHeaderNote(e.target.value)}
          rows={4}
          placeholder="e.g. Speed To Lead Procedure: Have Slack #new-lead Channel visible on screen at all times. Call a lead within 3 minutes of it coming in."
          className="w-full px-3 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] resize-y"
        />
      </div>

      {/* Tasks */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Tasks ({tasks.length})
        </label>
        <div className="space-y-2">
          {tasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              index={idx}
              total={tasks.length}
              onUpdate={patch => updateTask(idx, patch)}
              onDelete={() => deleteTask(idx)}
              onMoveUp={() => moveTask(idx, -1)}
              onMoveDown={() => moveTask(idx, 1)}
            />
          ))}
        </div>
        <button
          onClick={addTask}
          className="mt-3 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <div>
          {updatedAt && (
            <p className="text-[11px] text-slate-500">
              Last saved: {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: '#D6FF03' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Checklist
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && <ChecklistPreview headerNote={headerNote} tasks={tasks} />}
    </div>
  );
}