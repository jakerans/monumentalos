import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, DollarSign, Calendar, AlertTriangle, Plus, Trash2, Pencil, Check, Undo2 } from 'lucide-react';
import dayjs from 'dayjs';
import PayrollLineItems from '@/components/admin/PayrollLineItems';

const STEPS = { CONFIG: 'config', PREVIEW: 'preview', DONE: 'done' };

export default function RunPayrollModal({ open, onOpenChange, onComplete }) {
  const [payrollDate, setPayrollDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [checkNumber, setCheckNumber] = useState('first');
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
      checkNumber,
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

  const handleUndoPayroll = async () => {
    setUndoLoading(true);
    const res = await base44.functions.invoke('runPayroll', {
      mode: 'undo',
      payrollDate: undoDate,
    });
    setUndoLoading(false);
    setShowUndoConfirm(false);
    if (res.data?.success) {
      const count = res.data.deletedCount || 0;
      const reverted = res.data.perfRecordsReverted || 0;
      if (count === 0) {
        toast({ title: 'Nothing to Undo', description: `No payroll expenses found for ${undoDate}.` });
      } else {
        toast({ title: 'Payroll Undone', description: `Deleted ${count} expense(s)${reverted > 0 ? `, reverted ${reverted} perf pay record(s)` : ''}.` });
        if (onComplete) onComplete();
      }
    } else {
      toast({ title: 'Error', description: res.data?.error || 'Failed to undo payroll', variant: 'destructive' });
    }
  };

  const handleClose = (v) => {
    if (!v) {
      setStep(STEPS.CONFIG);
      setLineItems([]);
      setResult(null);
      setCheckNumber('first');
      setShowUndoConfirm(false);
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

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase mb-1.5 block">Which payroll run is this?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCheckNumber('first')}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                      checkNumber === 'first'
                        ? 'border-[#D6FF03] bg-[#D6FF03]/10 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <p className="font-bold text-sm">1st Check</p>
                    <p className="text-[10px] mt-0.5 opacity-70">Base pay + prior month bonuses</p>
                  </button>
                  <button
                    onClick={() => setCheckNumber('second')}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                      checkNumber === 'second'
                        ? 'border-slate-400 bg-slate-700/50 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <p className="font-bold text-sm">2nd Check</p>
                    <p className="text-[10px] mt-0.5 opacity-70">Base pay only</p>
                  </button>
                </div>
                {checkNumber === 'first' && (
                  <p className="text-[10px] text-slate-500 italic px-1">
                    Loads MM performance bonus, setter spiffs, and approved loot prizes from prior month.
                  </p>
                )}
                {checkNumber === 'second' && (
                  <p className="text-[10px] text-slate-500 italic px-1">
                    Base pay only. No bonuses will be included.
                  </p>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  This will generate a preview of all payroll line items. You can edit amounts, remove items, or add extra items (like taxes) before confirming.
                </p>
              </div>

              {/* Undo Payroll Section */}
              <div className="border-t border-slate-700/50 pt-4">
                <button
                  onClick={() => {
                    setUndoDate(payrollDate);
                    setShowUndoConfirm(!showUndoConfirm);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo a previous payroll run
                </button>

                {showUndoConfirm && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
                    <p className="text-xs text-red-300">
                      This will <span className="font-bold">permanently delete</span> all payroll expenses for the selected date and revert any performance pay records marked as paid.
                    </p>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">Payroll Date to Undo</label>
                      <input
                        type="date"
                        value={undoDate}
                        onChange={(e) => setUndoDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUndoPayroll}
                        disabled={undoLoading}
                        className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {undoLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        {undoLoading ? 'Undoing...' : 'Confirm Undo'}
                      </button>
                      <button
                        onClick={() => setShowUndoConfirm(false)}
                        className="px-4 py-2 text-xs border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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