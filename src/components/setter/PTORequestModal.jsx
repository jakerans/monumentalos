import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Palmtree, Loader2, UserCheck, AlertCircle, Gift, Calendar, Check } from 'lucide-react';

function formatShiftTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const RARITY_COLORS = {
  common: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  rare: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  epic: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  legendary: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
};

const RARITY_SELECTED = {
  common: 'border-slate-400 bg-slate-500/20 ring-1 ring-slate-400',
  rare: 'border-blue-400 bg-blue-500/20 ring-1 ring-blue-400',
  epic: 'border-purple-400 bg-purple-500/20 ring-1 ring-purple-400',
  legendary: 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400',
};

export default function PTORequestModal({ open, onOpenChange, setterId, existingRequestDates, onCreated, ptoBalance, unopenedBoxes }) {
  const [date, setDate] = useState('');
  const [covers, setCovers] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [notes, setNotes] = useState('');
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Offer state
  const [offerType, setOfferType] = useState('none');
  const [offerPtoDays, setOfferPtoDays] = useState(1);
  const [selectedBoxIds, setSelectedBoxIds] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const availablePto = ptoBalance?.days_available ?? 0;
  const boxes = unopenedBoxes || [];

  // Reset offer when cover changes
  useEffect(() => {
    if (!selectedCover) {
      setOfferType('none');
      setOfferPtoDays(1);
      setSelectedBoxIds([]);
    }
  }, [selectedCover]);

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setDate('');
      setCovers([]);
      setSelectedCover(null);
      setNotes('');
      setError('');
      setOfferType('none');
      setOfferPtoDays(1);
      setSelectedBoxIds([]);
    }
  }, [open]);

  useEffect(() => {
    if (!date || !setterId) { setCovers([]); return; }
    setLoadingCovers(true);
    setSelectedCover(null);
    setError('');
    base44.functions.invoke('managePTORequest', {
      action: 'get_available_covers',
      request_date: date,
      setter_id: setterId,
    }).then(res => {
      setCovers(res.data?.available_covers || []);
    }).finally(() => setLoadingCovers(false));
  }, [date, setterId]);

  const handleSubmit = async () => {
    if (!date) { setError('Please select a date'); return; }
    setSubmitting(true);
    setError('');

    const payload = {
      action: 'create_request',
      setter_id: setterId,
      request_date: date,
      cover_setter_id: selectedCover,
      notes,
      offer_type: selectedCover ? offerType : 'none',
    };
    if (selectedCover && offerType === 'pto_days') {
      payload.offer_quantity = offerPtoDays;
    }
    if (selectedCover && offerType === 'loot_boxes') {
      payload.offer_loot_box_ids = selectedBoxIds;
    }

    const res = await base44.functions.invoke('managePTORequest', payload);
    setSubmitting(false);

    if (res.data?.insufficient_pto) {
      setError(offerType === 'pto_days'
        ? "You don't have enough PTO days for this request plus your offer."
        : "You don't have enough PTO days available.");
      return;
    }
    if (res.data?.invalid_boxes) {
      setError('One or more selected loot boxes are no longer available.');
      return;
    }
    if (res.data?.duplicate) {
      setError('You already have a request for this date.');
      return;
    }
    if (res.data?.success) {
      toast({ title: 'PTO Request Submitted', description: selectedCover ? 'Awaiting cover acceptance.' : 'Sent to admin for review.' });
      onOpenChange(false);
      onCreated();
    }
  };

  const disabledDates = new Set(existingRequestDates || []);
  const maxOfferDays = Math.max(0, availablePto - 1);
  const totalPtoUsed = offerType === 'pto_days' ? 1 + offerPtoDays : 1;

  const toggleBox = (id) => {
    setSelectedBoxIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Palmtree className="w-5 h-5 text-blue-400" />
            Request PTO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Date */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={e => {
                const val = e.target.value;
                if (disabledDates.has(val)) {
                  setError('You already have a request for this date.');
                  return;
                }
                setDate(val);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          {/* Cover selector */}
          {date && (
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Coverage</label>
              {loadingCovers ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading available covers...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {covers.map(c => (
                    <button
                      key={c.setter_id}
                      onClick={() => setSelectedCover(c.setter_id === selectedCover ? null : c.setter_id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                        selectedCover === c.setter_id
                          ? 'border-[#D6FF03]/40 bg-[#D6FF03]/10 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.full_name}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatShiftTime(c.shift_start)} – {formatShiftTime(c.shift_end)}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedCover(null)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedCover === null
                        ? 'border-[#D6FF03]/40 bg-[#D6FF03]/10 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    No cover — submit to admin
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Offer Incentive — only when cover is selected */}
          {selectedCover && (
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Offer Incentive</label>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <button
                  onClick={() => setOfferType('none')}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                    offerType === 'none' ? 'border-[#D6FF03]/40 bg-[#D6FF03]/10 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  No Offer
                </button>
                <button
                  onClick={() => setOfferType('pto_days')}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    offerType === 'pto_days' ? 'border-blue-400/40 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-3 h-3" /> PTO Days
                </button>
                <button
                  onClick={() => setOfferType('loot_boxes')}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    offerType === 'loot_boxes' ? 'border-purple-400/40 bg-purple-500/10 text-purple-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Gift className="w-3 h-3" /> Loot Boxes
                </button>
              </div>

              {offerType === 'pto_days' && (
                <div className="space-y-2 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">Days to offer</label>
                    <span className="text-[10px] text-slate-500">Balance: {availablePto} days</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={maxOfferDays}
                    value={offerPtoDays}
                    onChange={e => setOfferPtoDays(Math.max(1, Math.min(maxOfferDays, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <p className="text-[10px] text-blue-400">
                    1 day for PTO + {offerPtoDays} day{offerPtoDays !== 1 ? 's' : ''} as offer = {totalPtoUsed} total days deducted
                  </p>
                </div>
              )}

              {offerType === 'loot_boxes' && (
                <div className="space-y-2 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                  {boxes.length === 0 ? (
                    <p className="text-xs text-slate-500">No unopened loot boxes available to offer.</p>
                  ) : (
                    <>
                      <p className="text-[10px] text-slate-400">Select boxes to offer ({selectedBoxIds.length} selected)</p>
                      <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                        {boxes.map(b => {
                          const sel = selectedBoxIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleBox(b.id)}
                              className={`relative px-2 py-2 text-[10px] font-medium rounded-lg border text-center capitalize transition-colors ${
                                sel ? RARITY_SELECTED[b.rarity] || RARITY_SELECTED.common : RARITY_COLORS[b.rarity] || RARITY_COLORS.common
                              }`}
                            >
                              {sel && <Check className="w-3 h-3 absolute top-1 right-1" />}
                              {b.rarity}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for PTO..."
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !date || (offerType === 'loot_boxes' && selectedCover && selectedBoxIds.length === 0)}
            className="w-full px-4 py-2.5 text-sm font-bold rounded-lg text-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#D6FF03' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palmtree className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}