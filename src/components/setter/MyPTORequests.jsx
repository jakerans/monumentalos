import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { FileText, X, Loader2 } from 'lucide-react';

const STATUS_BADGE = {
  pending_cover: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pending_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  denied: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-slate-700/50 text-slate-500 border-slate-600/30',
};

const STATUS_LABELS = {
  pending_cover: 'Pending Cover',
  pending_admin: 'Pending Admin',
  approved: 'Approved',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyPTORequests({ setterId }) {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-pto-requests', setterId],
    queryFn: async () => {
      const res = await base44.functions.invoke('managePTORequest', {
        action: 'get_my_requests',
        setter_id: setterId,
      });
      return res.data?.requests || [];
    },
    enabled: !!setterId,
    staleTime: 60 * 1000,
  });

  const requests = data || [];

  const handleCancel = async (requestId) => {
    setCancellingId(requestId);
    const res = await base44.functions.invoke('managePTORequest', {
      action: 'cancel',
      request_id: requestId,
    });
    setCancellingId(null);
    if (res.data?.already_approved) {
      toast({ title: 'Cannot cancel', description: 'This request is already approved — contact admin.', variant: 'destructive' });
    } else if (res.data?.success) {
      toast({ title: 'Request cancelled' });
    }
    queryClient.invalidateQueries({ queryKey: ['my-pto-requests', setterId] });
  };

  if (isLoading) return null;
  if (requests.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-400">My PTO Requests</h3>
      </div>
      <div className="space-y-1.5">
        {requests.map(r => {
          const canCancel = r.status !== 'approved' && r.status !== 'denied' && r.status !== 'cancelled';
          return (
            <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-700/40 bg-slate-800/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm text-white">{formatDate(r.request_date)}</p>
                  {r.cover_setter_name && (
                    <p className="text-[10px] text-slate-500">Cover: {r.cover_setter_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGE[r.status] || STATUS_BADGE.cancelled}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
                {canCancel && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={cancellingId === r.id}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Cancel request"
                  >
                    {cancellingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}