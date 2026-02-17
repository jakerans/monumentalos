import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

const FREQ_OPTIONS = [
  { value: 'weekly', label: 'Weekly (52 cycles/yr)' },
  { value: 'biweekly', label: 'Bi-Weekly (26 cycles/yr)' },
  { value: 'semi_monthly', label: 'Semi-Monthly (24 cycles/yr)' },
  { value: 'monthly', label: 'Monthly (12 cycles/yr)' },
];

const DAY_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export default function PayrollSettingsModal({ open, onOpenChange, settings, onSaved }) {
  const [form, setForm] = useState({
    payroll_frequency: 'biweekly',
    payroll_day_of_week: 'friday',
    payroll_day_1: 1,
    payroll_day_2: 15,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        payroll_frequency: settings.payroll_frequency || 'biweekly',
        payroll_day_of_week: settings.payroll_day_of_week || 'friday',
        payroll_day_1: settings.payroll_day_1 || 1,
        payroll_day_2: settings.payroll_day_2 || 15,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const data = { key: 'payroll', ...form };
    if (settings?.id) {
      await base44.entities.CompanySettings.update(settings.id, data);
    } else {
      await base44.entities.CompanySettings.create(data);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";
  const freq = form.payroll_frequency;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader><DialogTitle>Payroll Settings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Pay Frequency</label>
            <select className={inputCls} value={freq} onChange={e => setForm({ ...form, payroll_frequency: e.target.value })}>
              {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {(freq === 'weekly' || freq === 'biweekly') && (
            <div>
              <label className={labelCls}>Payday</label>
              <select className={inputCls} value={form.payroll_day_of_week} onChange={e => setForm({ ...form, payroll_day_of_week: e.target.value })}>
                {DAY_OPTIONS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
          )}

          {freq === 'semi_monthly' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Pay Day of Month</label>
                <input type="number" min="1" max="28" className={inputCls} value={form.payroll_day_1} onChange={e => setForm({ ...form, payroll_day_1: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <label className={labelCls}>Second Pay Day of Month</label>
                <input type="number" min="1" max="28" className={inputCls} value={form.payroll_day_2} onChange={e => setForm({ ...form, payroll_day_2: parseInt(e.target.value) || 15 })} />
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 uppercase mb-1">Cycles per year</p>
            <p className="text-lg font-bold text-white">
              {freq === 'weekly' ? 52 : freq === 'biweekly' ? 26 : freq === 'semi_monthly' ? 24 : 12}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Employee "pay per cycle" × this number = annual cost
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#D6FF03' }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}