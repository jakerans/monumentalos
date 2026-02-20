import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, DollarSign, Calendar, AlertTriangle, Plus, Trash2, Pencil, Check, Undo2 } from 'lucide-react';
import dayjs from 'dayjs';
import PayrollLineItems from './PayrollLineItems.js';

const STEPS = { CONFIG: 'config', PREVIEW: 'preview', DONE: 'done' };

export default function RunPayrollModal({ open, onOpenChange, onComplete }) {
  const [payrollDate, setPayrollDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [includePrevPerfPay, setIncludePrevPerfPay] = useState(false);
  const [step, setStep] = useState(STEPS.CONFIG);
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState([]);
  const [result, setResult] = useState(null);
  const [undoDate, setUndoDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [undoLoading, setUndoLoading] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const prevMonthLabel = dayjs(payrollDate).subtract(1, 'month').format('MMMM YYYY');

  const handleGeneratePreview = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('runPayroll', {
      mode: 'preview',
      payrollDate,
      includePrevPerfPay,
    });
    setLoading(false);
    if (res.data?.success) {
      setLineItems(res.data.items || []);
      setStep(STEPS.PREVIEW);
    } else {
      toast({ title: 'Error', description: res.data?.error || 'Failed to generate preview', variant: 'destructive' });
    }
  };

  const handleConfirmRun = async () => {
    const validItems = lineItems.filter(i => i.amount > 0);
    if (validItems.length === 0) {
      toast({ title: 'No Items', description: 'Add at least one line item with an amount > $0.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke('runPayroll', {
      mode: 'run',
      payrollDate,
      lineItems: validItems,
    });
    setLoading(false);
    if (res.data?.success) {
      setResult(res.data);
      setStep(STEPS.DONE);
      toast({ title: 'Payroll Complete', description: `${res.data.expensesCreated} expense(s) created.` });
      if (onComplete) onComplete();
    } else {
      toast({ title: 'Error', description: res.data?.error || 'Failed to run payroll', variant: 'destructive' });
    }
  };

  const handleClose = (v) => {
    if (!v) {
      setStep(STEPS.CONFIG);
      setLineItems([]);
      setResult(null);
      setIncludePrevPerfPay(false);
    }
    onOpenChange(v);
  };

  const totalAmount = lineItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <DollarSign className="w-5 h-5 text-[#D6FF03]" />
            Run Payroll
            {step === STEPS.PREVIEW && (
              <span className="text-xs font-normal text-slate-400 ml-2">— Review & Edit</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {step === STEPS.CONFIG && (
            <div className="space-y-5 py-2">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase mb-1.5 block">Payroll Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={payrollDate}
                    onChange={(e) => setPayrollDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePrevPerfPay}
                    onChange={(e) => setIncludePrevPerfPay(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-[#D6FF03] focus:ring-[#D6FF03]/50"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Include Previous Month Performance Pay</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pay out earned performance pay for <span className="text-slate-300 font-medium">{prevMonthLabel}</span> and mark it as paid.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  This will generate a preview of all payroll line items. You can edit amounts, remove items, or add extra items (like taxes) before confirming.
                </p>
              </div>
            </div>
          )}

          {step === STEPS.PREVIEW && (
            <PayrollLineItems
              lineItems={lineItems}
              setLineItems={setLineItems}
              payrollDate={payrollDate}
            />
          )}

          {step === STEPS.DONE && result && (
            <div className="space-y-4 py-2">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-green-400">{result.expensesCreated} Expense(s) Created</p>
                {result.perfRecordsMarkedPaid > 0 && (
                  <p className="text-xs text-slate-400 mt-1">{result.perfRecordsMarkedPaid} perf pay record(s) marked as paid</p>
                )}
              </div>
              {result.summary && result.summary.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.summary.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800 rounded-md px-3 py-2">
                      <span className="text-xs text-slate-300 truncate flex-1 mr-2">{item.description}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.type === 'cogs' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'}`}>{item.type}</span>
                        <span className="text-xs font-medium text-white">${item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-700/50 pt-3">
          {step === STEPS.CONFIG && (
            <>
              <button onClick={() => handleClose(false)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
              <button
                onClick={handleGeneratePreview}
                disabled={loading}
                className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: '#D6FF03' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Loading...' : 'Generate Preview'}
              </button>
            </>
          )}
          {step === STEPS.PREVIEW && (
            <>
              <div className="flex-1 text-left">
                <span className="text-xs text-slate-400">Total: </span>
                <span className="text-sm font-bold text-white">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs text-slate-500 ml-1">({lineItems.length} items)</span>
              </div>
              <button onClick={() => setStep(STEPS.CONFIG)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Back</button>
              <button
                onClick={handleConfirmRun}
                disabled={loading}
                className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: '#D6FF03' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Running...' : `Confirm & Run Payroll`}
              </button>
            </>
          )}
          {step === STEPS.DONE && (
            <button
              onClick={() => handleClose(false)}
              className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#D6FF03' }}
            >
              Done
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}