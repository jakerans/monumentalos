import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

export default function AddPaymentModal({ open, onOpenChange, clients, onCreated }) {
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('ach');
  const [notes, setNotes] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientId || !amount) return;
    setSaving(true);
    await base44.entities.Payment.create({
      client_id: clientId,
      amount: Number(amount),
      date,
      method,
      notes: notes || undefined,
      period_start: periodStart || undefined,
      period_end: periodEnd || undefined,
    });
    setSaving(false);
    setClientId(''); setAmount(''); setNotes('');
    setPeriodStart(''); setPeriodEnd('');
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Amount *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
              <option value="ach">ACH</option>
              <option value="check">Check</option>
              <option value="wire">Wire</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Period Start</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Period End</label>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="Optional..." />
          </div>
          <button onClick={handleSave} disabled={!clientId || !amount || saving} className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}