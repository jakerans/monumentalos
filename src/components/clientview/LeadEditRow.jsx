import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = ['new', 'first_call_made', 'contacted', 'appointment_booked', 'disqualified', 'completed'];
const DISPOSITION_OPTIONS = ['scheduled', 'showed', 'cancelled', 'rescheduled'];
const OUTCOME_OPTIONS = ['pending', 'sold', 'lost'];

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  first_call_made: 'bg-yellow-100 text-yellow-700',
  contacted: 'bg-cyan-100 text-cyan-700',
  appointment_booked: 'bg-green-100 text-green-700',
  disqualified: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
};

const toLocalDatetime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function LeadEditRow({ lead, expanded, onToggle, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    disposition: lead.disposition || '',
    outcome: lead.outcome || '',
    sale_amount: lead.sale_amount || '',
    date_sold: lead.date_sold || '',
    appointment_date: toLocalDatetime(lead.appointment_date),
    project_type: lead.project_type || '',
    budget_range: lead.budget_range || '',
    notes: lead.notes || '',
  });

  const handleSave = async () => {
    setSaving(true);
    const updates = { ...form };
    if (updates.appointment_date) updates.appointment_date = new Date(updates.appointment_date).toISOString();
    else delete updates.appointment_date;
    if (updates.sale_amount) updates.sale_amount = parseFloat(updates.sale_amount);
    else delete updates.sale_amount;
    if (!updates.date_sold) delete updates.date_sold;
    if (!updates.disposition) delete updates.disposition;
    if (!updates.outcome) delete updates.outcome;

    await base44.entities.Lead.update(lead.id, updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (onSave) onSave();
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-sm text-gray-900 truncate">{lead.name}</span>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${statusColors[lead.status] || 'bg-gray-100 text-gray-600'}`}>
            {(lead.status || 'new').replace(/_/g, ' ')}
          </span>
          {lead.disposition && (
            <span className="text-[10px] text-gray-400">{lead.disposition}</span>
          )}
          {lead.outcome && lead.outcome !== 'pending' && (
            <span className={`text-[10px] font-semibold ${lead.outcome === 'sold' ? 'text-green-600' : 'text-red-500'}`}>
              {lead.outcome}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lead.sale_amount > 0 && (
            <span className="text-xs font-bold text-green-600">${lead.sale_amount.toLocaleString()}</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Edit form */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Field label="Name" value={form.name} onChange={(v) => set('name', v)} />
            <Field label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} type="tel" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SelectField label="Status" value={form.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} />
            <SelectField label="Disposition" value={form.disposition} onChange={(v) => set('disposition', v)} options={DISPOSITION_OPTIONS} allowEmpty />
            <SelectField label="Outcome" value={form.outcome} onChange={(v) => set('outcome', v)} options={OUTCOME_OPTIONS} allowEmpty />
            <Field label="Appointment" value={form.appointment_date} onChange={(v) => set('appointment_date', v)} type="datetime-local" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Field label="Sale Amount" value={form.sale_amount} onChange={(v) => set('sale_amount', v)} type="number" prefix="$" />
            <Field label="Date Sold" value={form.date_sold} onChange={(v) => set('date_sold', v)} type="date" />
            <Field label="Project Type" value={form.project_type} onChange={(v) => set('project_type', v)} />
            <Field label="Budget Range" value={form.budget_range} onChange={(v) => set('budget_range', v)} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', prefix }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${prefix ? 'pl-5' : ''}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, allowEmpty }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {allowEmpty && <option value="">—</option>}
        {options.map(o => (
          <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}