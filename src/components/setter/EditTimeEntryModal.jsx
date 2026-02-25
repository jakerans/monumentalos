import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Clock } from 'lucide-react';

function toLocalDatetimeStr(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatReadableTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function EditTimeEntryModal({ entry, open, onOpenChange, onSubmitted }) {
  const [reqIn, setReqIn] = useState('');
  const [reqOut, setReqOut] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry && open) {
      setReqIn(toLocalDatetimeStr(entry.clock_in));
      setReqOut(toLocalDatetimeStr(entry.clock_out));
      setReason('');
    }
  }, [entry, open]);

  const calcHours = () => {
    if (!reqIn || !reqOut) return null;
    const diff = new Date(reqOut) - new Date(reqIn);
    if (diff <= 0) return null;
    return Math.round((diff / 3600000) * 100) / 100;
  };

  const newHours = calcHours();
  const isValid = reqIn && reqOut && newHours && newHours > 0 && newHours < 24 && reason.trim().length >= 10;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('manageTimeEntryEdit', {
        action: 'request_edit',
        time_entry_id: entry.id,
        requested_clock_in: new Date(reqIn).toISOString(),
        requested_clock_out: new Date(reqOut).toISOString(),
        reason: reason.trim(),
      });
      if (res.data?.success) {
        toast({ title: 'Edit request submitted — waiting for admin approval' });
        onOpenChange(false);
        onSubmitted?.();
      }
    } catch (err) {
      toast({ title: 'Request failed', description: err?.response?.data?.error || err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D6FF03]" />
            Request Clock Edit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Original values (read-only) */}
          <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/50 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Original Record</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Clock In</span>
              <span className="text-slate-300">{formatReadableTime(entry.clock_in)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Clock Out</span>
              <span className="text-slate-300">{formatReadableTime(entry.clock_out)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Hours</span>
              <span className="text-white font-medium">{entry.total_hours?.toFixed(2) || '—'}h</span>
            </div>
          </div>

          {/* New requested times */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">New Clock In</label>
              <input
                type="datetime-local"
                value={reqIn}
                onChange={(e) => setReqIn(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">New Clock Out</label>
              <input
                type="datetime-local"
                value={reqOut}
                onChange={(e) => setReqOut(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
              />
            </div>
          </div>

          {/* Live calculated hours */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <span className="text-xs text-slate-400">New Total Hours</span>
            <span className={`text-sm font-bold ${newHours && newHours > 0 && newHours < 24 ? 'text-[#D6FF03]' : 'text-red-400'}`}>
              {newHours ? `${newHours.toFixed(2)}h` : '—'}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Reason <span className="text-red-400">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Forgot to clock out, actual end time was 5:00 PM"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
            />
            {reason.length > 0 && reason.trim().length < 10 && (
              <p className="text-[10px] text-amber-400 mt-1">Please provide at least 10 characters</p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-black hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#D6FF03' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Submitting...' : 'Submit Edit Request'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(EditTimeEntryModal);