import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Save, Loader2, Check, Plus, Trash2 } from 'lucide-react';

const FIELDS = [
  { key: 'gross_revenue_goal', label: 'Gross Revenue', prefix: '$', placeholder: '50000' },
  { key: 'cash_collected_goal', label: 'Cash Collected', prefix: '$', placeholder: '45000' },
  { key: 'gross_margin_goal', label: 'Gross Margin', suffix: '%', placeholder: '60' },
  { key: 'net_margin_goal', label: 'Net Margin', suffix: '%', placeholder: '30' },
  { key: 'net_profit_goal', label: 'Net Profit', prefix: '$', placeholder: '15000' },
];

function MonthLabel(month) {
  const [y, m] = month.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function GoalManagementModal({ open, onOpenChange, goals, onSaved }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [form, setForm] = useState({});
  const [netProfitManual, setNetProfitManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const goal = goals.find(g => g.month === selectedMonth);

  useEffect(() => {
    if (goal) {
      const f = {};
      FIELDS.forEach(field => { f[field.key] = String(goal[field.key] || ''); });
      setForm(f);
      // If net profit was manually set (doesn't match auto calc), mark as manual
      const autoCalc = (Number(f.cash_collected_goal) || 0) * ((Number(f.net_margin_goal) || 0) / 100);
      setNetProfitManual(goal.net_profit_goal > 0 && Math.abs(goal.net_profit_goal - autoCalc) > 1);
    } else {
      const f = {};
      FIELDS.forEach(field => { f[field.key] = ''; });
      setForm(f);
      setNetProfitManual(false);
    }
    setSaved(false);
  }, [selectedMonth, goals]);

  const navigateMonth = (dir) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Auto-calculate net profit when cash collected or net margin changes (unless manually overridden)
  useEffect(() => {
    if (!netProfitManual) {
      const cash = Number(form.cash_collected_goal) || 0;
      const margin = Number(form.net_margin_goal) || 0;
      const auto = Math.round(cash * (margin / 100));
      setForm(prev => ({ ...prev, net_profit_goal: auto > 0 ? String(auto) : '' }));
    }
  }, [form.cash_collected_goal, form.net_margin_goal, netProfitManual]);

  const handleSave = async () => {
    setSaving(true);
    const data = { month: selectedMonth };
    FIELDS.forEach(f => { data[f.key] = Number(form[f.key]) || 0; });

    if (goal) {
      await base44.entities.CompanyGoal.update(goal.id, data);
    } else {
      await base44.entities.CompanyGoal.create(data);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: goal ? 'Goals Updated' : 'Goals Set', description: `${MonthLabel(selectedMonth)} goals saved.`, variant: 'success' });
    onSaved();
  };

  const handleDelete = async () => {
    if (!goal) return;
    await base44.entities.CompanyGoal.delete(goal.id);
    toast({ title: 'Goals Deleted', description: `${MonthLabel(selectedMonth)} goals removed.`, variant: 'destructive' });
    onSaved();
  };

  const copyFromPrevious = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevGoal = goals.find(g => g.month === prevMonth);
    if (prevGoal) {
      const f = {};
      FIELDS.forEach(field => { f[field.key] = String(prevGoal[field.key] || ''); });
      setForm(f);
    }
  };

  // Build list of months with goals for quick nav
  const goalMonths = goals.map(g => g.month).sort();
  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Company Goal Management</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Month navigator */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{MonthLabel(selectedMonth)}</p>
              {isCurrentMonth && <span className="text-[10px] text-blue-600 font-medium">Current Month</span>}
              {goal && !isCurrentMonth && <span className="text-[10px] text-green-600 font-medium">Goals Set</span>}
              {!goal && !isCurrentMonth && <span className="text-[10px] text-gray-400">No Goals</span>}
            </div>
            <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick month pills */}
          {goalMonths.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {goalMonths.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${
                    m === selectedMonth ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {MonthLabel(m)}
                </button>
              ))}
            </div>
          )}

          {/* Goal fields */}
          <div className="space-y-2.5">
            {FIELDS.map(field => {
              const isNetProfit = field.key === 'net_profit_goal';
              return (
                <div key={field.key}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">{field.label}</label>
                    {isNetProfit && !netProfitManual && (Number(form.cash_collected_goal) > 0 && Number(form.net_margin_goal) > 0) && (
                      <span className="text-[10px] text-blue-500 font-medium">Auto-calculated</span>
                    )}
                    {isNetProfit && netProfitManual && (
                      <button onClick={() => setNetProfitManual(false)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                        Reset to auto
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    {field.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{field.prefix}</span>
                    )}
                    <input
                      type="number"
                      value={form[field.key] || ''}
                      onChange={e => {
                        if (isNetProfit) setNetProfitManual(true);
                        setForm(prev => ({ ...prev, [field.key]: e.target.value }));
                      }}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNetProfit && !netProfitManual ? 'border-blue-200 bg-blue-50/30' : 'border-gray-300'} ${field.prefix ? 'pl-7' : ''} ${field.suffix ? 'pr-8' : ''}`}
                    />
                    {field.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{field.suffix}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : saved ? 'Saved!' : goal ? 'Update Goals' : 'Set Goals'}
            </button>
            {!goal && (
              <button
                onClick={copyFromPrevious}
                className="px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                title="Copy from previous month"
              >
                Copy Prev
              </button>
            )}
            {goal && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}