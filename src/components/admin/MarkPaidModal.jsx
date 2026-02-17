import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MarkPaidModal({ record, clientName, open, onOpenChange, onConfirm }) {
  const defaultAmount = record.billing_type === 'retainer'
    ? (record.manual_amount || record.calculated_amount || 0)
    : (record.calculated_amount || 0);

  const [paidAmount, setPaidAmount] = useState(String(defaultAmount));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(record.notes || '');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(record, Number(paidAmount), paidDate, notes);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm font-medium text-gray-900">{clientName}</p>
            <p className="text-xs text-gray-500">
              {record.billing_month} · {record.billing_type === 'retainer' ? 'Retainer' : record.billing_type === 'pay_per_set' ? `${record.quantity} appts set` : `${record.quantity} shows`}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1">${defaultAmount.toLocaleString()}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Amount Received</label>
            <input
              type="number"
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Date Received</label>
            <input
              type="date"
              value={paidDate}
              onChange={e => setPaidDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Check #1234"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleConfirm}
            disabled={!paidAmount || saving}
            className="w-full px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Confirm Payment'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}