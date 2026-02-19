import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

export default function AddExpenseModal({ open, onOpenChange, clients, onCreated }) {
  const [category, setCategory] = useState('ad_spend');
  const [expenseType, setExpenseType] = useState('overhead');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [vendor, setVendor] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || !category) return;
    setSaving(true);
    await base44.entities.Expense.create({
      category,
      expense_type: expenseType,
      description: description || undefined,
      amount: Number(amount),
      date,

      vendor: vendor || undefined,
      recurring,
    });
    setSaving(false);
    toast({ title: 'Expense Added', description: `$${Number(amount).toLocaleString()} — ${category}`, variant: 'success' });
    setDescription(''); setAmount(''); setVendor('');
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
                <option value="ad_spend">Ad Spend</option>
                <option value="payroll">Payroll</option>
                <option value="software">Software</option>
                <option value="office">Office</option>
                <option value="contractor">Contractor</option>
                <option value="travel">Travel</option>
                <option value="distribution">Distribution</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Type *</label>
              <select value={expenseType} onChange={e => setExpenseType(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
                <option value="cogs">COGS (Cost of Goods Sold)</option>
                <option value="overhead">Overhead</option>
              </select>
            </div>
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
            <label className="text-xs font-medium text-gray-700">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="e.g. Facebook Ads - Jan" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Vendor</label>
            <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="e.g. Meta, Gusto" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="rounded" />
            Recurring expense
          </label>
          <button onClick={handleSave} disabled={!amount || saving} className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Expense'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}