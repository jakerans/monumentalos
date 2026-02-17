import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SOURCE_OPTIONS = [
  { value: 'form', label: 'Form' },
  { value: 'msg', label: 'MSG' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'inbound_call', label: 'Inbound Call' },
];

export default function AddLeadModal({ open, onOpenChange, clients, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    client_id: '',
    lead_source: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.client_id || !form.lead_source) return;
    setLoading(true);
    await onAdd({
      ...form,
      lead_received_date: new Date().toISOString(),
    });
    setLoading(false);
    setForm({ name: '', phone: '', email: '', client_id: '', lead_source: '', notes: '' });
    onOpenChange(false);
  };

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Lead name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={(e) => update('client_id', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Lead Source *</label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('lead_source', opt.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    form.lead_source === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
              placeholder="Any initial notes..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !form.name || !form.client_id || !form.lead_source}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}