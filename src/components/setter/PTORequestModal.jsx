import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Palmtree, Loader2, UserCheck, AlertCircle } from 'lucide-react';

function formatShiftTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function PTORequestModal({ open, onOpenChange, setterId, existingRequestDates, onCreated }) {
  const [date, setDate] = useState('');
  const [covers, setCovers] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null); // null = no cover
  const [notes, setNotes] = useState('');
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch available covers when date changes
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
    const res = await base44.functions.invoke('managePTORequest', {
      action: 'create_request',
      setter_id: setterId,
      request_date: date,
      cover_setter_id: selectedCover,
      notes,
    });
    setSubmitting(false);

    if (res.data?.insufficient_pto) {
      setError("You don't have enough PTO days available.");
      return;
    }
    if (res.data?.duplicate) {
      setError('You already have a request for this date.');
      return;
    }
    if (res.data?.success) {
      toast({ title: 'PTO Request Submitted', description: selectedCover ? 'Awaiting cover acceptance.' : 'Sent to admin for review.' });
      setDate('');
      setNotes('');
      setSelectedCover(null);
      onOpenChange(false);
      onCreated();
    }
  };

  const disabledDates = new Set(existingRequestDates || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
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
            disabled={submitting || !date}
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