import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'setter', label: 'Setter' },
  { value: 'onboard_admin', label: 'Onboard Admin' },
  { value: 'client', label: 'Client' },
];

export default function AddEmployeeModal({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', app_role: 'setter',
    classification: 'salary', pay_per_cycle: '', hourly_rate: '', standard_monthly_hours: '',
    contractor_billing_type: 'monthly', contractor_rate: '',
    cost_type: 'overhead', discipline_status: 'green', start_date: '',
    has_performance_pay: false, notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, status: 'active' };
    if (form.classification === 'salary') {
      data.pay_per_cycle = parseFloat(form.pay_per_cycle) || 0;
    } else if (form.classification === 'hourly') {
      data.hourly_rate = parseFloat(form.hourly_rate) || 0;
      data.standard_monthly_hours = parseFloat(form.standard_monthly_hours) || 0;
    } else if (form.classification === 'contractor') {
      data.contractor_billing_type = form.contractor_billing_type;
      if (form.contractor_billing_type === 'per_cycle') {
        data.pay_per_cycle = parseFloat(form.pay_per_cycle) || 0;
      } else if (form.contractor_billing_type !== 'per_project') {
        data.contractor_rate = parseFloat(form.contractor_rate) || 0;
      }
    }
    onAdd(data);
    setForm({ full_name: '', email: '', phone: '', app_role: 'setter', classification: 'salary', pay_per_cycle: '', hourly_rate: '', standard_monthly_hours: '', contractor_billing_type: 'monthly', contractor_rate: '', cost_type: 'overhead', discipline_status: 'green', start_date: '', has_performance_pay: false, notes: '' });
    onOpenChange(false);
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";
  const selectCls = inputCls;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Full Name *</label><input className={inputCls} value={form.full_name} onChange={e => set('full_name', e.target.value)} required /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className={labelCls}>App Role</label><select className={selectCls} value={form.app_role} onChange={e => set('app_role', e.target.value)}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
            <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          </div>

          <hr className="border-slate-700" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Classification *</label>
              <select className={selectCls} value={form.classification} onChange={e => set('classification', e.target.value)}>
                <option value="salary">Salary</option>
                <option value="hourly">Hourly</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Cost Type *</label>
              <select className={selectCls} value={form.cost_type} onChange={e => set('cost_type', e.target.value)}>
                <option value="overhead">Overhead</option>
                <option value="cogs">COGS</option>
              </select>
            </div>
          </div>

          {form.classification === 'salary' && (
            <div><label className={labelCls}>Pay Per Cycle ($)</label><input type="number" className={inputCls} value={form.pay_per_cycle} onChange={e => set('pay_per_cycle', e.target.value)} placeholder="e.g. 2500" /></div>
          )}

          {form.classification === 'hourly' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Hourly Rate ($)</label><input type="number" className={inputCls} value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="e.g. 25" /></div>
              <div><label className={labelCls}>Standard Monthly Hours</label><input type="number" className={inputCls} value={form.standard_monthly_hours} onChange={e => set('standard_monthly_hours', e.target.value)} placeholder="e.g. 160" /></div>
            </div>
          )}

          {form.classification === 'contractor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Billing Type</label>
                <select className={selectCls} value={form.contractor_billing_type} onChange={e => set('contractor_billing_type', e.target.value)}>
                  <option value="hourly">Hourly</option>
                  <option value="monthly">Monthly</option>
                  <option value="per_cycle">Per Cycle</option>
                  <option value="per_project">Per Project</option>
                </select>
              </div>
              {form.contractor_billing_type === 'per_cycle' ? (
                <div><label className={labelCls}>Pay Per Cycle ($)</label><input type="number" className={inputCls} value={form.pay_per_cycle} onChange={e => set('pay_per_cycle', e.target.value)} placeholder="e.g. 2500" /></div>
              ) : form.contractor_billing_type !== 'per_project' ? (
                <div><label className={labelCls}>{form.contractor_billing_type === 'hourly' ? 'Hourly Rate ($)' : 'Monthly Rate ($)'}</label><input type="number" className={inputCls} value={form.contractor_rate} onChange={e => set('contractor_rate', e.target.value)} /></div>
              ) : null}
            </div>
          )}

          <div>
            <label className={labelCls}>Discipline Status</label>
            <div className="flex gap-2">
              {['green', 'yellow', 'red'].map(s => (
                <button type="button" key={s} onClick={() => set('discipline_status', s)} className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-colors capitalize ${form.discipline_status === s ? (s === 'green' ? 'bg-green-500/20 border-green-500 text-green-400' : s === 'yellow' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-red-500/20 border-red-500 text-red-400') : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div><label className={labelCls}>Notes</label><textarea className={inputCls + " h-16"} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>Add Employee</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}