import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Clock, Check, X, Loader2 } from 'lucide-react';

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const AdminTimeEditCard = React.memo(function AdminTimeEditCard({ request, onResolved }) {
  const [acting, setActing] = useState(false);
  const [showDeny, setShowDeny] = useState(false);
  const [denyNotes, setDenyNotes] = useState('');

  const handleApprove = async () => {
    setActing(true);
    await base44.functions.invoke('manageTimeEntryEdit', {
      action: 'approve',
      request_id: request.id,
    });
    setActing(false);
    toast({ title: 'Clock edit approved — time entry updated' });
    onResolved();
  };

  const handleDeny = async () => {
    setActing(true);
    await base44.functions.invoke('manageTimeEntryEdit', {
      action: 'deny',
      request_id: request.id,
      admin_notes: denyNotes || undefined,
    });
    setActing(false);
    toast({ title: 'Clock edit denied' });
    onResolved();
  };

  const origHours = request.original_total_hours?.toFixed(2) || '—';
  const reqHours = request.requested_total_hours?.toFixed(2) || '—';
  const entryDate = formatDate(request.original_clock_in || request.requested_clock_in);

  return (
    <div className="px-4 py-3 rounded-lg border border-slate-700/50 bg-slate-800/50 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{request.setter_name || 'Unknown'}</p>
          <p className="text-xs text-slate-400">{entryDate}</p>
          <div className="mt-1 space-y-0.5">
            <p className="text-[11px] text-slate-500">
              Original: {formatDateTime(request.original_clock_in)} – {formatDateTime(request.original_clock_out)}
              <span className="ml-1 text-slate-400 font-medium">({origHours}h)</span>
            </p>
            <p className="text-[11px] text-[#D6FF03]/80">
              Requested: {formatDateTime(request.requested_clock_in)} – {formatDateTime(request.requested_clock_out)}
              <span className="ml-1 text-[#D6FF03] font-medium">({reqHours}h)</span>
            </p>
          </div>
          {request.reason && (
            <p className="text-[10px] text-slate-500 mt-1 italic">"{request.reason}"</p>
          )}
        </div>

        {!showDeny && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleApprove} disabled={acting}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
            >
              {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Approve
            </button>
            <button onClick={() => setShowDeny(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <X className="w-3 h-3" /> Deny
            </button>
          </div>
        )}
      </div>

      {showDeny && (
        <div className="flex gap-2 items-end">
          <input type="text" value={denyNotes} onChange={e => setDenyNotes(e.target.value)}
            placeholder="Reason for denial (optional)..."
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-600"
          />
          <button onClick={handleDeny} disabled={acting}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 disabled:opacity-50"
          >
            {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Deny'}
          </button>
          <button onClick={() => { setShowDeny(false); setDenyNotes(''); }}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});

function AdminTimeEditQueue() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-time-edit-queue'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageTimeEntryEdit', { action: 'get_pending' });
      return res.data?.pending || [];
    },
    staleTime: 30 * 1000,
  });

  const queue = data || [];

  const handleResolved = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-time-edit-queue'] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Clock Edit Requests</h3>
        {queue.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{queue.length}</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-500 py-2">Loading...</p>
      ) : queue.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">No pending clock edit requests.</p>
      ) : (
        <div className="space-y-2">
          {queue.map(r => (
            <AdminTimeEditCard key={r.id} request={r} onResolved={handleResolved} />
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(AdminTimeEditQueue);