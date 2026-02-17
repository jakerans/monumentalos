import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

export default function SetGoalsModal({ open, onOpenChange, currentGoal, month, onSaved }) {
  const [grossRevenue, setGrossRevenue] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [grossMargin, setGrossMargin] = useState('');
  const [netMargin, setNetMargin] = useState('');
  const [netProfit, setNetProfit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentGoal) {
      setGrossRevenue(String(currentGoal.gross_revenue_goal || ''));
      setCashCollected(String(currentGoal.cash_collected_goal || ''));
      setGrossMargin(String(currentGoal.gross_margin_goal || ''));
      setNetMargin(String(currentGoal.net_margin_goal || ''));
      setNetProfit(String(currentGoal.net_profit_goal || ''));
    } else {
      setGrossRevenue(''); setCashCollected(''); setGrossMargin(''); setNetMargin(''); setNetProfit('');
    }
  }, [currentGoal, open]);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      month,
      gross_revenue_goal: Number(grossRevenue) || 0,
      cash_collected_goal: Number(cashCollected) || 0,
      gross_margin_goal: Number(grossMargin) || 0,
      net_margin_goal: Number(netMargin) || 0,
      net_profit_goal: Number(netProfit) || 0,
    };
    if (currentGoal) {
      await base44.entities.CompanyGoal.update(currentGoal.id, data);
    } else {
      await base44.entities.CompanyGoal.create(data);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const fields = [
    { label: 'Gross Revenue ($)', value: grossRevenue, set: setGrossRevenue, placeholder: '50000' },
    { label: 'Cash Collected ($)', value: cashCollected, set: setCashCollected, placeholder: '45000' },
    { label: 'Gross Margin (%)', value: grossMargin, set: setGrossMargin, placeholder: '60' },
    { label: 'Net Margin (%)', value: netMargin, set: setNetMargin, placeholder: '30' },
    { label: 'Net Profit ($)', value: netProfit, set: setNetProfit, placeholder: '15000' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Monthly Goals — {month}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {fields.map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-gray-700">{f.label}</label>
              <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            </div>
          ))}
          <button onClick={handleSave} disabled={saving} className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}