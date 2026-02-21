import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer' };

export default function EditInvoiceModal({ record, clientName, open, onOpenChange, onUpdated }) {
  const [billingType, setBillingType] = useState(record.billing_type);
  const [quantity, setQuantity] = useState(String(record.quantity || 0));
  const [rate, setRate] = useState(String(record.rate || 0));
  const [manualAmount, setManualAmount] = useState(String(record.manual_amount || record.calculated_amount || 0));
  const [notes, setNotes] = useState(record.notes || '');
  const [status, setStatus] = useState(record.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isRetainer = billingType === 'retainer' || billingType === 'hybrid_retainer';
  const isPerformance = billingType === 'hybrid_performance';
  const calculatedAmount = isRetainer
    ? Number(manualAmount)
    : isPerformance
      ? Number(quantity) * Number(rate)
      : Number(quantity) * Number(rate);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      billing_type: billingType,
      quantity: isRetainer ? 0 : Number(quantity),
      rate: Number(rate),
      calculated_amount: isRetainer ? Number(manualAmount) : Number(quantity) * Number(rate),
      manual_amount: isRetainer ? Number(manualAmount) : undefined,
      calculated_amount: isRetainer ? Number(manualAmount) : Number(quantity) * Number(rate),
      notes,
      status,
    };
    await base44.entities.MonthlyBilling.update(record.id, updates);
    setSaving(false);
    toast({ title: 'Invoice Updated', description: `${clientName} — ${record.billing_month}`, variant: 'success' });
    onUpdated();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await base44.entities.MonthlyBilling.delete(record.id);
    toast({ title: 'Invoice Deleted', description: `${clientName} — ${record.billing_month}`, variant: 'destructive' });
    onUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm font-medium text-gray-900">{clientName}</p>
            <p className="text-xs text-gray-500">{record.billing_month}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Billing Type</label>
            <select
              value={billingType}
              onChange={e => setBillingType(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="pay_per_show">Pay Per Show</option>
              <option value="pay_per_set">Pay Per Set</option>
              <option value="retainer">Retainer</option>
              <option value="hybrid_retainer">Hybrid — Base Retainer</option>
              <option value="hybrid_performance">Hybrid — Performance</option>
            </select>
          </div>

          {!isRetainer && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Quantity</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Rate ($)</label>
                <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
              </div>
            </div>
          )}

          {isRetainer && (
            <div>
              <label className="text-xs font-medium text-gray-700">
                {billingType === 'hybrid_retainer' ? 'Base Retainer Amount ($)' : 'Retainer Amount ($)'}
              </label>
              <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
            </div>
          )}

          <div className="bg-gray-50 rounded-md p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase">Calculated Amount</p>
            <p className="text-lg font-bold text-gray-900">${calculatedAmount.toLocaleString()}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="failed">Failed — Card Declined / Payment Bounced</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Invoice
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
              <p className="text-xs text-red-700 font-medium">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-white">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700">Confirm Delete</button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}