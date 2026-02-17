import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { base44 } from '@/api/base44Client';
import { CircleDot, UserX, DollarSign, X } from 'lucide-react';
import AddPerformancePayModal from './AddPerformancePayModal';

function getPayDisplay(emp) {
  if (!emp) return { monthly: '—', annual: '—' };
  if (emp.classification === 'salary') {
    const m = emp.salary_monthly || 0;
    return { monthly: `$${m.toLocaleString()}`, annual: `$${(m * 12).toLocaleString()}` };
  }
  if (emp.classification === 'hourly') {
    const m = (emp.hourly_rate || 0) * (emp.standard_monthly_hours || 0);
    return { monthly: `$${m.toLocaleString()}`, annual: `$${(m * 12).toLocaleString()}`, rate: `$${emp.hourly_rate}/hr × ${emp.standard_monthly_hours} hrs` };
  }
  if (emp.classification === 'contractor') {
    if (emp.contractor_billing_type === 'per_project') return { monthly: 'Per Project', annual: 'Per Project' };
    if (emp.contractor_billing_type === 'hourly') return { monthly: `$${emp.contractor_rate}/hr`, annual: '—' };
    return { monthly: `$${(emp.contractor_rate || 0).toLocaleString()}`, annual: `$${((emp.contractor_rate || 0) * 12).toLocaleString()}` };
  }
  return { monthly: '—', annual: '—' };
}

const DISC_COLORS = { green: 'bg-green-500/20 border-green-500 text-green-400', yellow: 'bg-yellow-500/20 border-yellow-500 text-yellow-400', red: 'bg-red-500/20 border-red-500 text-red-400' };
const ROLE_LABELS = { admin: 'Admin', marketing_manager: 'Marketing Manager', setter: 'Setter', onboard_admin: 'Onboard Admin', client: 'Client' };

export default function EmployeeDetailPanel({ employee, open, onOpenChange, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [perfPayOpen, setPerfPayOpen] = useState(false);
  const [dismissConfirm, setDismissConfirm] = useState(false);

  React.useEffect(() => {
    if (employee) {
      setForm({ ...employee });
      setEditing(false);
      setDismissConfirm(false);
    }
  }, [employee]);

  if (!employee) return null;
  const pay = getPayDisplay(employee);

  const handleSave = async () => {
    const updates = { ...form };
    if (form.classification === 'salary') updates.salary_monthly = parseFloat(form.salary_monthly) || 0;
    if (form.classification === 'hourly') {
      updates.hourly_rate = parseFloat(form.hourly_rate) || 0;
      updates.standard_monthly_hours = parseFloat(form.standard_monthly_hours) || 0;
    }
    if (form.classification === 'contractor' && form.contractor_billing_type !== 'per_project') {
      updates.contractor_rate = parseFloat(form.contractor_rate) || 0;
    }
    await base44.entities.Employee.update(employee.id, updates);
    setEditing(false);
    onUpdated();
  };

  const handleDismiss = async () => {
    await base44.entities.Employee.update(employee.id, { status: 'dismissed', dismissed_date: new Date().toISOString().split('T')[0] });
    onOpenChange(false);
    onUpdated();
  };

  const togglePerfPay = async () => {
    if (employee.has_performance_pay) {
      await base44.entities.Employee.update(employee.id, { has_performance_pay: false });
      onUpdated();
    } else {
      setPerfPayOpen(true);
    }
  };

  const inputCls = "w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]";
  const labelCls = "text-[10px] font-medium text-slate-400 uppercase mb-0.5 block";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-slate-900 border-slate-700 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center justify-between">
              {employee.full_name}
              {employee.status === 'dismissed' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Dismissed</span>}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Quick info */}
            {!editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className={labelCls}>Role</p><p className="text-sm text-slate-200">{ROLE_LABELS[employee.app_role] || '—'}</p></div>
                  <div><p className={labelCls}>Classification</p><p className="text-sm text-slate-200 capitalize">{employee.classification}{employee.classification === 'contractor' ? ` (${employee.contractor_billing_type})` : ''}</p></div>
                  <div><p className={labelCls}>Monthly Cost</p><p className="text-sm font-medium text-white">{pay.monthly}</p></div>
                  <div><p className={labelCls}>Annual Cost</p><p className="text-sm text-slate-300">{pay.annual}</p></div>
                  {pay.rate && <div className="col-span-2"><p className={labelCls}>Rate Breakdown</p><p className="text-sm text-slate-300">{pay.rate}</p></div>}
                  <div><p className={labelCls}>Cost Type</p><span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${employee.cost_type === 'cogs' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'}`}>{employee.cost_type}</span></div>
                  <div><p className={labelCls}>Discipline</p><span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${DISC_COLORS[employee.discipline_status]}`}><CircleDot className="w-3 h-3" />{employee.discipline_status}</span></div>
                  {employee.email && <div><p className={labelCls}>Email</p><p className="text-sm text-slate-300">{employee.email}</p></div>}
                  {employee.phone && <div><p className={labelCls}>Phone</p><p className="text-sm text-slate-300">{employee.phone}</p></div>}
                  {employee.start_date && <div><p className={labelCls}>Start Date</p><p className="text-sm text-slate-300">{employee.start_date}</p></div>}
                  <div><p className={labelCls}>Performance Pay</p><p className="text-sm">{employee.has_performance_pay ? <span className="text-purple-400 font-medium">Active</span> : <span className="text-slate-500">None</span>}</p></div>
                </div>
                {employee.notes && <div><p className={labelCls}>Notes</p><p className="text-sm text-slate-400">{employee.notes}</p></div>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                  <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className={labelCls}>Role</label><select className={inputCls} value={form.app_role || ''} onChange={e => setForm({ ...form, app_role: e.target.value })}><option value="admin">Admin</option><option value="marketing_manager">Marketing Manager</option><option value="setter">Setter</option><option value="onboard_admin">Onboard Admin</option><option value="client">Client</option></select></div>
                  <div><label className={labelCls}>Classification</label><select className={inputCls} value={form.classification} onChange={e => setForm({ ...form, classification: e.target.value })}><option value="salary">Salary</option><option value="hourly">Hourly</option><option value="contractor">Contractor</option></select></div>
                  <div><label className={labelCls}>Cost Type</label><select className={inputCls} value={form.cost_type} onChange={e => setForm({ ...form, cost_type: e.target.value })}><option value="overhead">Overhead</option><option value="cogs">COGS</option></select></div>
                </div>
                {form.classification === 'salary' && (
                  <div><label className={labelCls}>Monthly Salary ($)</label><input type="number" className={inputCls} value={form.salary_monthly || ''} onChange={e => setForm({ ...form, salary_monthly: e.target.value })} /></div>
                )}
                {form.classification === 'hourly' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Hourly Rate ($)</label><input type="number" className={inputCls} value={form.hourly_rate || ''} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} /></div>
                    <div><label className={labelCls}>Monthly Hours</label><input type="number" className={inputCls} value={form.standard_monthly_hours || ''} onChange={e => setForm({ ...form, standard_monthly_hours: e.target.value })} /></div>
                  </div>
                )}
                {form.classification === 'contractor' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Billing Type</label><select className={inputCls} value={form.contractor_billing_type || 'monthly'} onChange={e => setForm({ ...form, contractor_billing_type: e.target.value })}><option value="hourly">Hourly</option><option value="monthly">Monthly</option><option value="per_project">Per Project</option></select></div>
                    {form.contractor_billing_type !== 'per_project' && <div><label className={labelCls}>Rate ($)</label><input type="number" className={inputCls} value={form.contractor_rate || ''} onChange={e => setForm({ ...form, contractor_rate: e.target.value })} /></div>}
                  </div>
                )}
                <div>
                  <label className={labelCls}>Discipline Status</label>
                  <div className="flex gap-2">
                    {['green', 'yellow', 'red'].map(s => (
                      <button type="button" key={s} onClick={() => setForm({ ...form, discipline_status: s })} className={`px-3 py-1 text-xs font-bold rounded-full border capitalize ${form.discipline_status === s ? DISC_COLORS[s] : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div><label className={labelCls}>Notes</label><textarea className={inputCls + ' h-16'} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-700">
              {!editing ? (
                <>
                  <button onClick={() => setEditing(true)} className="w-full px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>Edit Employee</button>
                  <button onClick={togglePerfPay} className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 flex items-center justify-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    {employee.has_performance_pay ? 'Remove Performance Pay' : 'Add Performance Pay'}
                  </button>
                  {employee.status !== 'dismissed' && (
                    !dismissConfirm ? (
                      <button onClick={() => setDismissConfirm(true)} className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2">
                        <UserX className="w-3.5 h-3.5" /> Dismiss Employee
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={handleDismiss} className="flex-1 px-4 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm Dismiss</button>
                        <button onClick={() => setDismissConfirm(false)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>Save</button>
                  <button onClick={() => { setEditing(false); setForm({ ...employee }); }} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AddPerformancePayModal
        open={perfPayOpen}
        onOpenChange={setPerfPayOpen}
        employee={employee}
        onAdded={onUpdated}
      />
    </>
  );
}