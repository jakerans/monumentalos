import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function NewProjectModal({ open, onOpenChange, clients, templates, mmUsers, onCreate }) {
  const [clientId, setClientId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [mmId, setMmId] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const selectedClient = clients.find(c => c.id === clientId);
  const selectedTemplate = templates.find(t => t.id === templateId);

  const handleCreate = async () => {
    if (!clientId || !templateId) return;
    setCreating(true);
    await onCreate({
      client_id: clientId,
      client_name: selectedClient?.name || '',
      template_id: templateId,
      template_name: selectedTemplate?.name || '',
      assigned_mm_id: mmId || null,
      status: 'in_progress',
      started_date: new Date().toISOString(),
      notes,
    }, selectedTemplate);
    setClientId('');
    setTemplateId('');
    setMmId('');
    setNotes('');
    setCreating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Onboarding Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Template *</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select a template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.tasks?.length || 0} tasks)</option>)}
            </select>
            {selectedTemplate?.description && (
              <p className="text-xs text-gray-400 mt-1">{selectedTemplate.description}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Assign Marketing Manager</label>
            <select value={mmId} onChange={e => setMmId(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None (assign later)</option>
              {mmUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Any special instructions..." />
          </div>
          <button
            onClick={handleCreate}
            disabled={!clientId || !templateId || creating}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Project & Generate Tasks'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}