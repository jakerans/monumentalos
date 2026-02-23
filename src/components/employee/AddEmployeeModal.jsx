import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'finance_admin', label: 'Finance Admin' },
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
    has_performance_pay: false, notes: '', send_invite: true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const shouldInvite = form.send_invite;

    const data = {
      full_name: form.full_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      app_role: form.app_role,
      classification: form.classification,
      cost_type: form.cost_type,
      discipline_status: form.discipline_status,
      status: 'active',
      has_performance_pay: form.has_performance_pay,
    };

    if (form.start_date) data.start_date = form.start_date;
    if (form.notes?.trim()) data.notes = form.notes.trim();

    if (form.classification === 'salary') {
      data.pay_per_cycle = parseFloat(form.pay_per_cycle) || 0;
    } else if (form.classification === 'hourly') {
      data.hourly_rate = parseFloat(form.hourly_rate) || 0;
      data.standard_monthly_hours = parseFloat(form.standard_monthly_hours) || 0;
    } else if (form.classification === 'contractor') {
      data.contractor_billing_type = form.contractor_billing_type;
      if (form.contractor_billing_type === 'per_cycle') {
        data.pay_per_cycle = parseFloat(form.pay_per_cycle) || 0;
      } else if (form.contractor_billing_type === 'hourly') {
        data.hourly_rate = parseFloat(form.hourly_rate) || 0;
      }
      data.contractor_rate = parseFloat(form.contractor_rate) || 0;
    }

    Object.keys(data).forEach(k => { if (data[k] === undefined) delete data[k]; });

    try {
      await onAdd(data);

      if (shouldInvite && form.email?.trim()) {
        try {
          const role = form.app_role || 'setter';
          const platformRole = (role === 'admin' || role === 'onboard_admin') ? 'admin' : 'user';
          await base44.users.inviteUser(form.email.trim(), platformRole);

          if (role !== 'admin') {
            await base44.entities.PendingInvite.create({
              email: form.email.trim().toLowerCase(),
              intended_role: role,
              status: 'pending',
            });
          }

          toast({ title: 'Invitation Sent', description: `${form.email} will receive a login invite.`, variant: 'success' });
        } catch (invErr) {
          toast({
            title: 'Employee added, but invite failed',
            description: invErr?.response?.data?.error || invErr?.message || 'You can resend from Team Settings.',
            variant: 'warning',
          });
        }
      }

      setForm({
        full_name: '', email: '', phone: '', app_role: 'setter',
        classification: 'salary', pay_per_cycle: '', hourly_rate: '', standard_monthly_hours: '',
        contractor_billing_type: 'monthly', contractor_rate: '',
        cost_type: 'overhead', discipline_status: 'green', start_date: '',
        has_performance_pay: false, notes: '', send_invite: true,
      });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Failed to add employee', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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

          {form.email?.trim() && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <input
                type="checkbox"
                checked={form.send_invite}
                onChange={(e) => set('send_invite', e.target.checked)}
                className="mt-0.5 rounded border-gray-300"
                id="send-invite-check"
              />
              <div>
                <label htmlFor="send-invite-check" className="text-sm font-medium text-gray-800 cursor-pointer">
                  Send app invitation
                </label>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {form.email} will receive an email to create their account and log into the app as <strong>{ROLES.find(r => r.value === form.app_role)?.label || form.app_role}</strong>.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 text-sm font-bold rounded-lg text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#D6FF03' }}
            >
              {saving ? 'Adding...' : form.send_invite && form.email?.trim() ? 'Add Employee & Send Invite' : 'Add Employee'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}