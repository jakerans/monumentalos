import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

export default function RecordPaymentModal({ open, onOpenChange, clients, billingRecords = [], onCreated }) {
  const [clientId, setClientId] = useState('');
  const [billingId, setBillingId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [method, setMethod] = useState('ach');
  const [processingFee, setProcessingFee] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const unpaidRecords = useMemo(() => {
    if (!clientId) return [];
    return billingRecords.filter(b => b.client_id === clientId && b.status !== 'paid');
  }, [billingRecords, clientId]);

  const selectedRecord = unpaidRecords.find(b => b.id === billingId);

  const handleSelectBilling = (id) => {
    setBillingId(id);
    const rec = unpaidRecords.find(b => b.id === id);
    if (rec) {
      setAmount(String(rec.calculated_amount || rec.manual_amount || 0));
    }
  };

  const handleSave = async () => {
    if (!clientId || !amount) return;
    setSaving(true);

    const feeAmount = Number(processingFee) || 0;

    if (billingId && selectedRecord) {
      await base44.entities.MonthlyBilling.update(billingId, {
        status: 'paid',
        paid_amount: Number(amount),
        paid_date: date,
        payment_method: method,
        processing_fee: feeAmount || undefined,
        notes: notes || selectedRecord.notes || undefined,
      });
    } else {
      const client = clients.find(c => c.id === clientId);
      const monthStr = dayjs(date).format('YYYY-MM');
      await base44.entities.MonthlyBilling.create({
        client_id: clientId,
        billing_month: monthStr,
        billing_type: client?.billing_type || 'pay_per_set',
        calculated_amount: Number(amount),
        paid_amount: Number(amount),
        paid_date: date,
        payment_method: method,
        processing_fee: feeAmount || undefined,
        status: 'paid',
        notes: notes || 'Manual payment',
      });
    }

    // Auto-create processing fee expense as COGS
    if (feeAmount > 0) {
      const cName = clients.find(c => c.id === clientId)?.name || 'Client';
      await base44.entities.Expense.create({
        category: 'processing_fee',
        expense_type: 'cogs',
        description: `Processing fee — ${cName}`,
        amount: feeAmount,
        date: date,
        client_id: clientId,
        vendor: method === 'credit_card' ? 'Credit Card Processor' : 'Payment Processor',
      });
    }

    setSaving(false);
    const cName = clients.find(c => c.id === clientId)?.name || 'Client';
    toast({ title: 'Payment Recorded', description: `$${Number(amount).toLocaleString()} from ${cName}`, variant: 'success' });
    setClientId(''); setBillingId(''); setAmount(''); setProcessingFee(''); setNotes('');
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
            <select value={clientId} onChange={e => { setClientId(e.target.value); setBillingId(''); setAmount(''); }} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {unpaidRecords.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-700">Link to Invoice (optional)</label>
              <select value={billingId} onChange={e => handleSelectBilling(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
                <option value="">Ad-hoc payment (no invoice)</option>
                {unpaidRecords.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.invoice_id || b.billing_month} — ${(b.calculated_amount || b.manual_amount || 0).toLocaleString()} ({b.status})
                  </option>
                ))}
              </select>
            </div>
          )}

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
          <div>
            <label className="text-xs font-medium text-gray-700">Processing Fee ($)</label>
            <input type="number" value={processingFee} onChange={e => setProcessingFee(e.target.value)} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            <p className="text-[10px] text-gray-400 mt-0.5">Auto-logged as COGS expense</p>
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