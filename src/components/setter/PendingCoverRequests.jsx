import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Shield, Check, X, Loader2 } from 'lucide-react';

const RARITY_TEXT = {
  common: 'text-slate-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

function formatOfferDetails(offer) {
  if (!offer || offer.type !== 'loot_boxes' || !offer.loot_boxes) return null;
  const counts = {};
  offer.loot_boxes.forEach(b => { counts[b.rarity] = (counts[b.rarity] || 0) + 1; });
  const parts = Object.entries(counts).map(([r, c]) => ({ rarity: r, label: `${c}x ${r.charAt(0).toUpperCase() + r.slice(1)}` }));
  return { text: `🎁 Offering ${offer.quantity} booking reward${offer.quantity !== 1 ? 's' : ''}`, parts };
}

function formatShiftTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PendingCoverRequests({ setterId, onActionComplete }) {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-covers', setterId],
    queryFn: async () => {
      const res = await base44.functions.invoke('managePTORequest', {
        action: 'get_pending_covers', setter_id: setterId,
      });
      return res.data?.pending_covers || [];
    },
    enabled: !!setterId,
    staleTime: 30 * 1000,
  });

  const pending = data || [];

  const handleRespond = async (requestId, accepted) => {
    setActingId(requestId);
    await base44.functions.invoke('managePTORequest', {
      action: 'respond_cover', request_id: requestId, accepted,
    });
    setActingId(null);
    toast({
      title: accepted ? 'Coverage accepted' : 'Coverage declined',
      description: accepted ? 'Awaiting admin approval.' : 'Request sent to admin without cover.',
    });
    queryClient.invalidateQueries({ queryKey: ['pending-covers', setterId] });
    onActionComplete?.();
  };

  if (isLoading || pending.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-400">
          You have {pending.length} coverage request{pending.length !== 1 ? 's' : ''}
        </h3>
      </div>

      {pending.map(r => {
        const offer = formatOfferDetails(r.offer_details);
        return (
          <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-700/40 bg-slate-800/60">
            <div className="min-w-0">
              <p className="text-sm text-white font-medium">{r.requester_name}</p>
              <p className="text-xs text-slate-400">
                {formatDate(r.request_date)}
                {r.shift_start && r.shift_end && (
                  <span className="ml-2 text-slate-500">{formatShiftTime(r.shift_start)} – {formatShiftTime(r.shift_end)}</span>
                )}
              </p>
              {offer && (
                <div className="mt-0.5">
                  <p className="text-xs text-green-400">{offer.text}</p>
                  <p className="text-[10px] text-slate-500">
                    {offer.parts.map((p, i) => (
                      <span key={i}>{i > 0 ? ', ' : ''}<span className={RARITY_TEXT[p.rarity] || ''}>{p.label}</span></span>
                    ))}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => handleRespond(r.id, true)} disabled={actingId === r.id}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
              >
                {actingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Accept
              </button>
              <button onClick={() => handleRespond(r.id, false)} disabled={actingId === r.id}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" /> Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}