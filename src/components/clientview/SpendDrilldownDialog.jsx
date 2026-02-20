import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';

export default function SpendDrilldownDialog({ open, onOpenChange, title, spendRecords, onUpdated }) {
  const [expandedId, setExpandedId] = useState(null);
  const sorted = [...spendRecords].sort((a, b) => b.date.localeCompare(a.date));

  const total = spendRecords.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-gray-200">
          <DialogTitle className="text-lg">{title} ({spendRecords.length} records · ${total.toLocaleString()})</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No spend records</p>
          ) : (
            <div className="space-y-1.5">
              {sorted.map(record => (
                <SpendEditRow
                  key={record.id}
                  record={record}
                  expanded={expandedId === record.id}
                  onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  onSave={onUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpendEditRow({ record, expanded, onToggle, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: record.date || '',
    amount: record.amount || '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const updates = { ...form };
    if (updates.amount) updates.amount = parseFloat(updates.amount);

    await base44.entities.Spend.update(record.id, updates);
    setSaving(false);
    if (onSave) onSave();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{record.date}</span>
          <span className="text-sm font-semibold text-gray-900">${(record.amount || 0).toLocaleString()}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Amount ($)</label>
              <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Campaign</label>
              <input type="text" value={form.campaign_name} onChange={(e) => set('campaign_name', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Impressions</label>
              <input type="number" value={form.impressions} onChange={(e) => set('impressions', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Clicks</label>
              <input type="number" value={form.clicks} onChange={(e) => set('clicks', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Leads Count</label>
              <input type="number" value={form.leads_count} onChange={(e) => set('leads_count', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}