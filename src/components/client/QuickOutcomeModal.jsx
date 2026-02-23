import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

const formatApptDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return dateStr; }
};

const dispositionColors = {
  showed: 'bg-green-500/15 text-green-400 border border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
  scheduled: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  rescheduled: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  no_show: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
};

export default function QuickOutcomeModal({ open, onOpenChange, lead, onUpdated }) {
  const [step, setStep] = useState(1); // 1 = disposition, 2 = outcome, 3 = sale details
  const [saving, setSaving] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [dateSold, setDateSold] = useState(new Date().toISOString().split('T')[0]);

  // Reset state when lead changes or modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSaving(false);
      setSaleAmount('');
      setDateSold(new Date().toISOString().split('T')[0]);
    }
  }, [open, lead?.id]);

  if (!lead) return null;

  const save = async (updates) => {
    setSaving(true);
    await base44.entities.Lead.update(lead.id, updates);
    setSaving(false);
  };

  const handleNoShow = async () => {
    await save({ disposition: 'no_show' });
    toast({ title: 'Marked as No-Show' });
    onUpdated();
  };

  const handleCancelled = async () => {
    await save({ disposition: 'cancelled' });
    toast({ title: 'Marked as Cancelled' });
    onUpdated();
  };

  const handleShowed = async () => {
    await save({ disposition: 'showed' });
    setStep(2);
  };

  const handleNotSold = async () => {
    await save({ outcome: 'lost' });
    toast({ title: 'Outcome recorded' });
    onUpdated();
  };

  const handleSold = () => {
    setStep(3);
  };

  const handleConfirmSale = async () => {
    const amount = parseFloat(saleAmount);
    if (!saleAmount || isNaN(amount) || amount <= 0) {
      toast({ title: 'Enter a valid sale amount', variant: 'destructive' });
      return;
    }
    if (!dateSold) {
      toast({ title: 'Select a date sold', variant: 'destructive' });
      return;
    }
    await save({ outcome: 'sold', sale_amount: amount, date_sold: dateSold });
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#22c55e', '#10b981', '#059669', '#FFD700', '#FFA500'] });
    toast({ title: `🎉 Sale Recorded! $${amount.toLocaleString()}` });
    onUpdated();
  };

  const stepVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md p-0 overflow-hidden">
        {/* Appointment context — always visible */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-700/60">
          <p className="text-lg font-bold text-white leading-tight">{lead.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatApptDate(lead.appointment_date)}</span>
          </div>
          {(lead.industries?.length > 0 || lead.project_type) && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <Tag className="w-3 h-3 shrink-0" />
              <span>{[lead.industries?.join(', '), lead.project_type].filter(Boolean).join(' · ')}</span>
            </div>
          )}
          {lead.disposition && (
            <div className="mt-2">
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${dispositionColors[lead.disposition] || dispositionColors.scheduled}`}>
                {lead.disposition.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Step content */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                <p className="text-sm font-semibold text-slate-200 mb-3">Did this appointment show?</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={saving}
                    onClick={handleShowed}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50 text-sm font-semibold"
                  >
                    <span className="text-lg">✅</span>
                    <span>Showed</span>
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleNoShow}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50 text-sm font-semibold"
                  >
                    <span className="text-lg">❌</span>
                    <span>No-Show</span>
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleCancelled}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                  >
                    <span className="text-lg">🚫</span>
                    <span>Cancelled</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <p className="text-sm font-semibold text-slate-200 mb-3">What was the result?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={saving}
                    onClick={handleSold}
                    className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-lg border bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 text-sm font-semibold"
                  >
                    <span className="text-xl">🎉</span>
                    <span>Sold!</span>
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleNotSold}
                    className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-lg border bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                  >
                    <span className="text-xl">👎</span>
                    <span>Not Sold</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <p className="text-sm font-semibold text-slate-200 mb-3">Enter sale details</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Sale Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        autoFocus
                        value={saleAmount}
                        onChange={(e) => setSaleAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Date Sold</label>
                    <input
                      type="date"
                      value={dateSold}
                      onChange={(e) => setDateSold(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
                    />
                  </div>
                  <button
                    disabled={saving}
                    onClick={handleConfirmSale}
                    className="w-full py-3 rounded-lg text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
                    style={{ backgroundColor: '#D6FF03' }}
                  >
                    {saving ? 'Saving…' : 'Confirm Sale'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}