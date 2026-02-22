import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Palmtree, Check, X, Loader2, UserCheck, ChevronDown, Gift, ArrowRightLeft, Undo2 } from 'lucide-react';

const RARITY_TEXT = { common: 'text-slate-400', rare: 'text-blue-400', epic: 'text-purple-400', legendary: 'text-amber-400' };

function formatOfferLabel(offer) {
  if (!offer || offer.type !== 'loot_boxes' || !offer.loot_boxes) return null;
  const counts = {};
  offer.loot_boxes.forEach(b => { counts[b.rarity] = (counts[b.rarity] || 0) + 1; });
  const parts = Object.entries(counts).map(([r, c]) => ({ rarity: r, label: `${c}x ${r.charAt(0).toUpperCase() + r.slice(1)}` }));
  return { label: `Offer: ${offer.quantity} loot box${offer.quantity !== 1 ? 'es' : ''}`, parts };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const AdminPTOCard = React.memo(function AdminPTOCard({ request, onResolved }) {
  const [acting, setActing] = useState(false);
  const [showDeny, setShowDeny] = useState(false);
  const [denyNotes, setDenyNotes] = useState('');
  const [showCoverSelect, setShowCoverSelect] = useState(false);
  const [availableCovers, setAvailableCovers] = useState([]);
  const [overrideCover, setOverrideCover] = useState(null);
  const [loadingCovers, setLoadingCovers] = useState(false);

  const hasCover = !!request.cover_setter_id && request.cover_accepted;

  const fetchCovers = async () => {
    if (availableCovers.length > 0) { setShowCoverSelect(!showCoverSelect); return; }
    setLoadingCovers(true);
    const res = await base44.functions.invoke('managePTORequest', {
      action: 'get_available_covers', request_date: request.request_date, setter_id: request.setter_id,
    });
    setAvailableCovers(res.data?.available_covers || []);
    setShowCoverSelect(true);
    setLoadingCovers(false);
  };

  const handleApprove = async () => {
    setActing(true);
    await base44.functions.invoke('managePTORequest', {
      action: 'admin_resolve', request_id: request.id, decision: 'approved',
      override_cover_setter_id: overrideCover || undefined,
    });
    setActing(false);
    toast({ title: 'PTO approved — schedule updated' });
    onResolved();
  };

  const handleDeny = async () => {
    setActing(true);
    await base44.functions.invoke('managePTORequest', {
      action: 'admin_resolve', request_id: request.id, decision: 'denied',
      admin_notes: denyNotes || undefined,
    });
    setActing(false);
    toast({ title: 'PTO denied' });
    onResolved();
  };

  const offerInfo = formatOfferLabel(request.offer_details);

  return (
    <div className="px-4 py-3 rounded-lg border border-slate-700/50 bg-slate-800/50 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{request.setter_name}</p>
          <p className="text-xs text-slate-400">{formatDate(request.request_date)}</p>
          {hasCover ? (
            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3" /> Cover: {request.cover_setter_name} ✓
            </p>
          ) : (
            <p className="text-xs text-amber-400 mt-0.5">No cover assigned</p>
          )}
          {offerInfo && (
            <div className="mt-0.5 flex items-center gap-1">
              <Gift className="w-3 h-3 text-green-400/80" />
              <span className="text-[10px] text-green-400/80">{offerInfo.label}</span>
              <span className="text-[10px] text-slate-500 ml-1">
                ({offerInfo.parts.map((p, i) => (
                  <span key={i}>{i > 0 ? ', ' : ''}<span className={RARITY_TEXT[p.rarity] || ''}>{p.label}</span></span>
                ))})
              </span>
            </div>
          )}
          {request.notes && <p className="text-[10px] text-slate-500 mt-0.5">{request.notes}</p>}
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

      {!hasCover && (
        <div>
          <button onClick={fetchCovers} disabled={loadingCovers}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
          >
            {loadingCovers ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
            Assign cover (optional)
          </button>
          {showCoverSelect && (
            <div className="mt-1.5 space-y-1">
              {availableCovers.length === 0 ? (
                <p className="text-[10px] text-slate-500">No setters scheduled that day</p>
              ) : (
                availableCovers.map(c => (
                  <button key={c.setter_id}
                    onClick={() => setOverrideCover(c.setter_id === overrideCover ? null : c.setter_id)}
                    className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 text-xs rounded border transition-colors ${
                      overrideCover === c.setter_id ? 'border-[#D6FF03]/40 bg-[#D6FF03]/10 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.full_name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

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
}

});

const PendingTransferCard = React.memo(function PendingTransferCard({ request, onAction }) {
  const [acting, setActing] = useState(false);

  const offerInfo = formatOfferLabel(request.offer_details);

  const handleRelease = async () => {
    setActing(true);
    await base44.functions.invoke('managePTORequest', {
      action: 'finalize_transfer', request_id: request.id,
    });
    setActing(false);
    toast({ title: `Loot boxes transferred to ${request.cover_setter_name}` });
    onAction();
  };

  const handleReturn = async () => {
    setActing(true);
    await base44.functions.invoke('managePTORequest', {
      action: 'return_held_boxes', request_id: request.id,
    });
    setActing(false);
    toast({ title: `Loot boxes returned to ${request.setter_name}` });
    onAction();
  };

  return (
    <div className="px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{request.setter_name}</p>
          <p className="text-xs text-slate-400">{formatDate(request.request_date)}</p>
          {request.cover_setter_name && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3" /> Cover: {request.cover_setter_name}
            </p>
          )}
          {offerInfo && (
            <div className="mt-0.5 flex items-center gap-1">
              <Gift className="w-3 h-3 text-amber-400/80" />
              <span className="text-[10px] text-amber-400">{offerInfo.label}</span>
              <span className="text-[10px] text-slate-500 ml-1">
                ({offerInfo.parts.map((p, i) => (
                  <span key={i}>{i > 0 ? ', ' : ''}<span className={RARITY_TEXT[p.rarity] || ''}>{p.label}</span></span>
                ))})
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={handleRelease} disabled={acting}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
          >
            {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
            Release
          </button>
          <button onClick={handleReturn} disabled={acting}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
          >
            <Undo2 className="w-3 h-3" /> Return
          </button>
        </div>
      </div>
    </div>
  );
}

});

function AdminPTOQueue({ onScheduleChanged }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pto-queue'],
    queryFn: async () => {
      const res = await base44.functions.invoke('managePTORequest', { action: 'get_admin_queue' });
      return res.data?.queue || [];
    },
    staleTime: 30 * 1000,
  });

  const { data: transferData } = useQuery({
    queryKey: ['admin-pending-transfers'],
    queryFn: async () => {
      const res = await base44.functions.invoke('managePTORequest', { action: 'get_pending_transfers' });
      return res.data?.pending_transfers || [];
    },
    staleTime: 30 * 1000,
  });

  const queue = data || [];
  const pendingTransfers = transferData || [];

  const handleResolved = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pto-queue'] });
    queryClient.invalidateQueries({ queryKey: ['admin-pending-transfers'] });
    onScheduleChanged?.();
  };

  const handleTransferAction = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pending-transfers'] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palmtree className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">PTO Requests</h3>
        {queue.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{queue.length}</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-500 py-2">Loading...</p>
      ) : queue.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">No pending PTO requests.</p>
      ) : (
        <div className="space-y-2">
          {queue.map(r => (
            <AdminPTOCard key={r.id} request={r} onResolved={handleResolved} />
          ))}
        </div>
      )}

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700/30">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-xs font-semibold text-amber-400">Pending Transfers</h4>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{pendingTransfers.length}</span>
          </div>
          {pendingTransfers.map(r => (
            <PendingTransferCard key={r.id} request={r} onAction={handleTransferAction} />
          ))}
        </div>
      )}
    </div>
  );
}