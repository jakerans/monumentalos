import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

export default function AddPerformancePayModal({ open, onOpenChange, employee, onAdded }) {
  const [form, setForm] = useState({
    name: '', type: 'tiered', frequency: 'monthly', metric: 'revenue',
    tiers: [{ label: 'Tier 1', threshold: 50000, percentage: 5 }, { label: 'Tier 2', threshold: 70000, percentage: 8 }],
    flat_amount: '', notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateTier = (idx, field, value) => {
    const t = [...form.tiers];
    t[idx] = { ...t[idx], [field]: field === 'label' ? value : parseFloat(value) || 0 };
    set('tiers', t);
  };

  const addTier = () => set('tiers', [...form.tiers, { label: `Tier ${form.tiers.length + 1}`, threshold: 0, percentage: 0 }]);
  const removeTier = (idx) => set('tiers', form.tiers.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    const data = {
      employee_id: employee.id,
      name: form.name,
      type: form.type,
      frequency: form.frequency,
      metric: form.metric,
      notes: form.notes,
      status: 'active',
    };
    if (form.type === 'tiered' || form.type === 'revenue_percentage') {
      data.tiers = form.tiers;
    }
    if (form.type === 'flat_bonus') {
      data.flat_amount = parseFloat(form.flat_amount) || 0;
    }
    await base44.entities.PerformancePay.create(data);
    await base44.entities.Employee.update(employee.id, { has_performance_pay: true });
    onAdded();
    onOpenChange(false);
    setForm({ name: '', type: 'tiered', frequency: 'monthly', metric: 'revenue', tiers: [{ label: 'Tier 1', threshold: 50000, percentage: 5 }, { label: 'Tier 2', threshold: 70000, percentage: 8 }], flat_amount: '', notes: '' });
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Performance Pay — {employee?.full_name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className={labelCls}>Plan Name</label><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Revenue Commission" required /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="tiered">Tiered</option>
                <option value="revenue_percentage">Revenue %</option>
                <option value="flat_bonus">Flat Bonus</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Frequency</label>
              <select className={inputCls} value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Metric</label>
            <select className={inputCls} value={form.metric} onChange={e => set('metric', e.target.value)}>
              <option value="revenue">Revenue</option>
              <option value="appointments">Appointments</option>
              <option value="shows">Shows</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {(form.type === 'tiered' || form.type === 'revenue_percentage') && (
            <div>
              <label className={labelCls}>Tiers</label>
              <div className="space-y-2">
                {form.tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={inputCls + ' !w-24'} value={tier.label} onChange={e => updateTier(i, 'label', e.target.value)} />
                    <span className="text-xs text-slate-500">over $</span>
                    <input type="number" className={inputCls + ' !w-24'} value={tier.threshold} onChange={e => updateTier(i, 'threshold', e.target.value)} />
                    <span className="text-xs text-slate-500">→</span>
                    <input type="number" className={inputCls + ' !w-16'} value={tier.percentage} onChange={e => updateTier(i, 'percentage', e.target.value)} />
                    <span className="text-xs text-slate-500">%</span>
                    {form.tiers.length > 1 && <button type="button" onClick={() => removeTier(i)} className="text-xs text-red-400 hover:text-red-300">×</button>}
                  </div>
                ))}
                <button type="button" onClick={addTier} className="text-xs text-[#D6FF03] hover:underline">+ Add Tier</button>
              </div>
            </div>
          )}

          {form.type === 'flat_bonus' && (
            <div><label className={labelCls}>Bonus Amount ($)</label><input type="number" className={inputCls} value={form.flat_amount} onChange={e => set('flat_amount', e.target.value)} /></div>
          )}

          <div><label className={labelCls}>Notes</label><textarea className={inputCls + ' h-16'} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Describe how this performance pay works..." /></div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>Add Performance Pay</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}