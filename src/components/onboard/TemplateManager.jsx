import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, GripVertical, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TemplateManager({ templates, onRefresh }) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const openNew = () => {
    setEditingTemplate({ name: '', description: '', tasks: [], status: 'active' });
    setShowEditor(true);
  };

  const openEdit = (template) => {
    setEditingTemplate({ ...template, tasks: [...(template.tasks || [])] });
    setShowEditor(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await base44.entities.OnboardTemplate.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Onboard Templates</h2>
        <button onClick={openNew} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-black rounded-md hover:opacity-90" style={{backgroundColor:'#D6FF03'}}>
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-8 text-center text-xs text-slate-500">
          No templates yet. Create your first onboarding template to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.id} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                  {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1 text-slate-500 hover:text-[#D6FF03]"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1">
                {(t.tasks || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-slate-600 font-mono w-4">{i + 1}</span>
                    <span className="flex-1 truncate">{task.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      task.assigned_to === 'marketing_manager' ? 'bg-purple-500/15 text-purple-400' : 'bg-indigo-500/15 text-indigo-400'
                    }`}>
                      {task.assigned_to === 'marketing_manager' ? 'MM' : 'Onboard'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
          onSave={onRefresh}
        />
      )}
    </div>
  );
}

function TemplateEditor({ template, onClose, onSave }) {
  const [name, setName] = useState(template.name || '');
  const [description, setDescription] = useState(template.description || '');
  const [tasks, setTasks] = useState(template.tasks || []);
  const [saving, setSaving] = useState(false);

  const addTask = () => {
    setTasks([...tasks, { title: '', description: '', assigned_to: 'onboard_admin', order: tasks.length }]);
  };

  const updateTask = (idx, field, value) => {
    const updated = [...tasks];
    updated[idx] = { ...updated[idx], [field]: value };
    setTasks(updated);
  };

  const removeTask = (idx) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const orderedTasks = tasks.map((t, i) => ({ ...t, order: i }));
    const data = { name: name.trim(), description: description.trim(), tasks: orderedTasks, status: 'active' };

    if (template.id) {
      await base44.entities.OnboardTemplate.update(template.id, data);
    } else {
      await base44.entities.OnboardTemplate.create(data);
    }
    onSave();
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.id ? 'Edit Template' : 'New Template'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Template Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Kitchen Remodel Client" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="When to use this template" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Tasks</label>
              <button onClick={addTask} className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700">
                <Plus className="w-3 h-3" /> Add Task
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={idx} className="bg-gray-50 rounded-md p-2.5 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-400 font-mono mt-2 w-4">{idx + 1}</span>
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={task.title}
                        onChange={e => updateTask(idx, 'title', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Task title"
                      />
                      <input
                        value={task.description || ''}
                        onChange={e => updateTask(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Description (optional)"
                      />
                      <select
                        value={task.assigned_to}
                        onChange={e => updateTask(idx, 'assigned_to', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="onboard_admin">Onboard Admin</option>
                        <option value="marketing_manager">Marketing Manager</option>
                      </select>
                    </div>
                    <button onClick={() => removeTask(idx)} className="text-gray-400 hover:text-red-500 mt-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}