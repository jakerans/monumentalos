import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Pause, Play, History } from 'lucide-react';

export default function PerformancePayDetailPanel({ plan, employees, open, onOpenChange, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const { data: records = [], refetch: refetchRecords } = useQuery({
    queryKey: ['perf-records', plan?.id],
    queryFn: () => base44.entities.PerformancePayRecord.filter({ performance_pay_id: plan.id }, '-created_date', 20),
    enabled: !!plan?.id,
  });

  useEffect(() => {
    if (plan) { setForm({ ...plan }); setEditing(false); }
  }, [plan]);

  if (!plan) return null;
  const emp = employees.find(e => e.id === plan.employee_id);

  const handleSave = async () => {
    const updates = {
      name: form.name,
      type: form.type,
      frequency: form.frequency,
      metric: form.metric,
      notes: form.notes,
      current_period_progress: parseFloat(form.current_period_progress) || 0,
      current_period_payout: parseFloat(form.current_period_payout) || 0,
    };
    if (form.type === 'tiered' || form.type === 'revenue_percentage') {
      updates.tiers = form.tiers;
    }
    if (form.type === 'flat_bonus') {
      updates.flat_amount = parseFloat(form.flat_amount) || 0;
    }
    await base44.entities.PerformancePay.update(plan.id, updates);
    setEditing(false);
    onUpdated();
  };

  const toggleStatus = async () => {
    const newStatus = plan.status === 'active' ? 'paused' : 'active';
    await base44.entities.PerformancePay.update(plan.id, { status: newStatus });
    onUpdated();
  };

  const updateTier = (idx, field, value) => {
    const t = [...(form.tiers || [])];
    t[idx] = { ...t[idx], [field]: field === 'label' ? value : parseFloat(value) || 0 };
    setForm({ ...form, tiers: t });
  };

  const inputCls = "w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]";
  const labelCls = "text-[10px] font-medium text-slate-400 uppercase mb-0.5 block";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-700 text-white w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">{plan.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{emp?.full_name || 'Unknown'}</span>
            <span>•</span>
            <span className="capitalize">{plan.frequency}</span>
            <span>•</span>
            <span className={`font-medium ${plan.status === 'active' ? 'text-green-400' : plan.status === 'paused' ? 'text-yellow-400' : 'text-red-400'}`}>{plan.status}</span>
          </div>

          {!editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className={labelCls}>Type</p><p className="text-sm text-slate-200 capitalize">{plan.type?.replace('_', ' ')}</p></div>
                <div><p className={labelCls}>Metric</p><p className="text-sm text-slate-200 capitalize">{plan.metric}</p></div>
                <div><p className={labelCls}>Current Progress</p><p className="text-sm font-medium text-white">${(plan.current_period_progress || 0).toLocaleString()}</p></div>
                <div><p className={labelCls}>Current Payout</p><p className="text-sm font-medium text-green-400">${(plan.current_period_payout || 0).toLocaleString()}</p></div>
              </div>

              {plan.tiers && plan.tiers.length > 0 && (
                <div>
                  <p className={labelCls}>Tiers</p>
                  <div className="space-y-1">
                    {plan.tiers.map((t, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-800 rounded-md px-3 py-1.5">
                        <span className="text-xs text-slate-300">{t.label}</span>
                        <span className="text-xs text-slate-400">Over ${t.threshold?.toLocaleString()} → {t.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.type === 'flat_bonus' && (
                <div><p className={labelCls}>Flat Amount</p><p className="text-sm text-white">${(plan.flat_amount || 0).toLocaleString()}</p></div>
              )}

              {plan.notes && <div><p className={labelCls}>Notes</p><p className="text-sm text-slate-400">{plan.notes}</p></div>}
            </div>
          ) : (
            <div className="space-y-3">
              <div><label className={labelCls}>Plan Name</label><input className={inputCls} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Type</label><select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="tiered">Tiered</option><option value="revenue_percentage">Revenue %</option><option value="flat_bonus">Flat Bonus</option><option value="custom">Custom</option></select></div>
                <div><label className={labelCls}>Frequency</label><select className={inputCls} value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></div>
                <div><label className={labelCls}>Current Progress</label><input type="number" className={inputCls} value={form.current_period_progress || ''} onChange={e => setForm({ ...form, current_period_progress: e.target.value })} /></div>
                <div><label className={labelCls}>Current Payout</label><input type="number" className={inputCls} value={form.current_period_payout || ''} onChange={e => setForm({ ...form, current_period_payout: e.target.value })} /></div>
              </div>
              {(form.type === 'tiered' || form.type === 'revenue_percentage') && form.tiers && (
                <div>
                  <label className={labelCls}>Tiers</label>
                  {form.tiers.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <input className={inputCls + ' !w-20'} value={t.label} onChange={e => updateTier(i, 'label', e.target.value)} />
                      <span className="text-xs text-slate-500">$</span>
                      <input type="number" className={inputCls + ' !w-24'} value={t.threshold} onChange={e => updateTier(i, 'threshold', e.target.value)} />
                      <span className="text-xs text-slate-500">→</span>
                      <input type="number" className={inputCls + ' !w-14'} value={t.percentage} onChange={e => updateTier(i, 'percentage', e.target.value)} />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  ))}
                </div>
              )}
              <div><label className={labelCls}>Notes</label><textarea className={inputCls + ' h-16'} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-700">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="w-full px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>Edit Plan</button>
                <button onClick={toggleStatus} className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2">
                  {plan.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pause Performance Pay</> : <><Play className="w-3.5 h-3.5" /> Resume Performance Pay</>}
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>Save</button>
                <button onClick={() => { setEditing(false); setForm({ ...plan }); }} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
              </div>
            )}
          </div>

          {/* Past records */}
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-medium text-slate-400 uppercase">Past Records</p>
            </div>
            {records.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">No past records yet</p>
            ) : (
              <div className="space-y-1">
                {records.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-800 rounded-md px-3 py-2">
                    <div>
                      <p className="text-xs text-slate-200">{r.period}</p>
                      {r.tier_reached && <p className="text-[10px] text-slate-500">{r.tier_reached}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-green-400">${(r.payout || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">${(r.metric_value || 0).toLocaleString()} {plan.metric}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}