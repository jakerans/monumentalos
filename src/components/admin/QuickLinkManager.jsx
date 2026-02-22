import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ICON_OPTIONS = [
  'Phone', 'MessageSquare', 'Globe', 'ExternalLink', 'Mail', 
  'Video', 'Headphones', 'BookOpen', 'FileText', 'Link'
];

export default function QuickLinkManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ label: '', url: '', icon: 'ExternalLink', is_active: true });
  const [showForm, setShowForm] = useState(false);

  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['quick-links-admin'],
    queryFn: () => base44.entities.QuickLink.list('-order'),
    staleTime: 30 * 1000,
  });

  const handleAdd = async () => {
    if (!formData.label || !formData.url) {
      toast({ title: 'Missing fields', description: 'Label and URL are required', variant: 'warning' });
      return;
    }
    try {
      const nextOrder = links.length > 0 ? Math.max(...links.map(l => l.order || 0)) + 1 : 1;
      await base44.entities.QuickLink.create({ ...formData, order: nextOrder });
      setFormData({ label: '', url: '', icon: 'ExternalLink', is_active: true });
      setShowForm(false);
      refetch();
      toast({ title: 'Link added', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    }
  };

  const handleUpdate = async () => {
    if (!formData.label || !formData.url) {
      toast({ title: 'Missing fields', description: 'Label and URL are required', variant: 'warning' });
      return;
    }
    try {
      await base44.entities.QuickLink.update(editingId, { label: formData.label, url: formData.url, icon: formData.icon, is_active: formData.is_active });
      setFormData({ label: '', url: '', icon: 'ExternalLink', is_active: true });
      setEditingId(null);
      setShowForm(false);
      refetch();
      toast({ title: 'Link updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this link?')) return;
    try {
      await base44.entities.QuickLink.delete(id);
      refetch();
      toast({ title: 'Link deleted', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await base44.entities.QuickLink.update(id, { is_active: !currentActive });
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    }
  };

  const handleReorder = async (id, direction) => {
    const idx = links.findIndex(l => l.id === id);
    if (direction === 'up' && idx > 0) {
      const link = links[idx];
      const prevLink = links[idx - 1];
      await Promise.all([
        base44.entities.QuickLink.update(link.id, { order: (prevLink.order || 0) - 1 }),
      ]);
    } else if (direction === 'down' && idx < links.length - 1) {
      const link = links[idx];
      const nextLink = links[idx + 1];
      await Promise.all([
        base44.entities.QuickLink.update(link.id, { order: (nextLink.order || 0) + 1 }),
      ]);
    }
    refetch();
  };

  const startEdit = (link) => {
    setEditingId(link.id);
    setFormData({ label: link.label, url: link.url, icon: link.icon, is_active: link.is_active });
    setShowForm(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormData({ label: '', url: '', icon: 'ExternalLink', is_active: true });
    setShowForm(true);
  };

  if (isLoading) return <div className="text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Quick Links</h2>
        <p className="text-xs text-slate-400 mt-1">Manage external tool links shown in the setter nav bar</p>
      </div>

      <button
        onClick={startAdd}
        className="px-4 py-2 text-xs font-bold text-black rounded-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#D6FF03' }}
      >
        <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Add Link
      </button>

      {showForm && (
        <div className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-600 rounded-md bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          />
          <input
            type="text"
            placeholder="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-600 rounded-md bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          />
          <select
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-600 rounded-md bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          >
            {ICON_OPTIONS.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-600 text-[#D6FF03] focus:ring-[#D6FF03]"
            />
            <span className="text-xs">Active</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="flex-1 px-3 py-2 text-xs font-bold text-black rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#D6FF03' }}
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 px-3 py-2 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">No quick links yet. Create one to get started.</div>
      ) : (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div key={link.id} className="flex items-center gap-3 px-4 py-3 bg-slate-700/20 rounded-lg border border-slate-700/30">
              <div className="w-6 h-6 flex items-center justify-center text-slate-400 shrink-0">::</div>
              <div className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded min-w-[30px] text-center">{link.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{link.label}</p>
                <p className="text-xs text-slate-400 truncate">{link.url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {idx > 0 && (
                  <button
                    onClick={() => handleReorder(link.id, 'up')}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx < links.length - 1 && (
                  <button
                    onClick={() => handleReorder(link.id, 'down')}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleToggleActive(link.id, link.is_active)}
                  className={`p-1 rounded transition-colors ${link.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700/50'}`}
                  title={link.is_active ? 'Active' : 'Inactive'}
                >
                  {link.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => startEdit(link)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}