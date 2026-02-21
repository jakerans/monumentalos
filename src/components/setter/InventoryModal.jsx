import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LootBoxOpenModal from './LootBoxOpenModal';

const RARITY_COLORS = {
  common: { primary: '#94a3b8', gradientFrom: '#334155', gradientTo: '#1e293b', glow: '0 0 30px #94a3b840', glowStrong: '0 0 60px #94a3b860' },
  rare: { primary: '#60a5fa', gradientFrom: '#1e3a5f', gradientTo: '#1e3a8a', glow: '0 0 60px #60a5fa80', glowStrong: '0 0 120px #60a5faaa' },
  epic: { primary: '#a855f7', gradientFrom: '#3b0764', gradientTo: '#581c87', glow: '0 0 80px #a855f7aa', glowStrong: '0 0 160px #a855f7cc' },
  legendary: { primary: '#fbbf24', gradientFrom: '#1c1400', gradientTo: '#78350f', glow: '0 0 100px #fbbf24bb', glowStrong: '0 0 200px #fbbf24dd' },
};

const rarityBadgeClass = {
  common: 'bg-slate-600 text-white',
  rare: 'bg-blue-600 text-white',
  epic: 'bg-purple-600 text-white',
  legendary: 'bg-amber-600 text-white',
};

export default function InventoryModal({
  open,
  onClose,
  unopenedBoxes = [],
  inventoryCap = 10,
  yellowWarning = 8,
  eligibility = {},
  lifetimeStats = {},
  recentWins = [],
  setterId,
  onOpenBox,
  onOpeningStateChange,
  lootSettings,
}) {
  const [openingBox, setOpeningBox] = useState(null);
  const openAllMode = useRef(false);
  const queryClient = useQueryClient();

  const { data: inventoryData } = useQuery({
    queryKey: ['setter-inventory', setterId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterInventoryData', { setter_id: setterId });
      return res.data;
    },
    enabled: !!setterId && open,
  });

  const liveBoxes = inventoryData?.unopenedBoxes ?? unopenedBoxes;
  const liveLifetimeStats = inventoryData?.lifetimeStats || lifetimeStats;
  const liveRecentWins = inventoryData?.recentWins || recentWins;
  const paidDaysOffBank = inventoryData?.paidDaysOffBank || null;

  if (!open) return null;

  const count = liveBoxes.length;
  const countColor = count >= inventoryCap ? 'text-red-500' : count >= yellowWarning ? 'text-amber-400' : 'text-white';

  const handleWinResult = (win) => {
    queryClient.invalidateQueries({ queryKey: ['setter-inventory', setterId] });
    if (onOpenBox) onOpenBox(win);
  };

  const handleOpenModalClose = (saveForLater = false) => {
    if (saveForLater) {
      openAllMode.current = false;
    }
    const currentBoxId = openingBox?.id;
    setOpeningBox(null);
    if (onOpeningStateChange) onOpeningStateChange(false);
    queryClient.invalidateQueries({ queryKey: ['setter-inventory', setterId] });

    if (openAllMode.current) {
      const remaining = liveBoxes.filter(b => b.id !== currentBoxId);
      if (remaining.length > 0) {
        setTimeout(() => {
          setOpeningBox(remaining[0]);
          if (onOpeningStateChange) onOpeningStateChange(true);
        }, 300);
      } else {
        openAllMode.current = false;
      }
    }
  };

  const handleOpenAll = () => {
    if (liveBoxes.length > 0) {
      openAllMode.current = true;
      setOpeningBox(liveBoxes[0]);
      if (onOpeningStateChange) onOpeningStateChange(true);
    }
  };

  const handleOpenSingle = (box) => {
    openAllMode.current = false;
    setOpeningBox(box);
    if (onOpeningStateChange) onOpeningStateChange(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white">My Inventory</h2>
              <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <EligibilityBanner eligibility={inventoryData?.eligibility || eligibility} />

            <div className="px-5 py-4 space-y-6">
              <LifetimeStatsRow stats={liveLifetimeStats} paidDaysOffBank={paidDaysOffBank} />
              <InventoryGrid
                boxes={liveBoxes}
                count={count}
                cap={inventoryCap}
                countColor={countColor}
                onOpenBox={handleOpenSingle}
                onOpenAll={handleOpenAll}
                lootSettings={lootSettings}
              />
              <RecentWinsFeed wins={liveRecentWins} />
            </div>
          </motion.div>

          <LootBoxOpenModal
            box={openingBox}
            open={!!openingBox}
            onClose={(saveForLater) => handleOpenModalClose(saveForLater)}
            onOpened={handleWinResult}
            setterId={setterId}
            lootSettings={lootSettings}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EligibilityBanner({ eligibility }) {
  const { eligible, avgSTL, threshold, reason } = eligibility;

  if (reason === 'no_data') {
    return (
      <div className="px-5 py-2.5 bg-amber-600/20 border-b border-amber-600/30">
        <span className="text-sm text-amber-300 font-medium">⚠ No recent STL data — eligible by default</span>
      </div>
    );
  }

  if (eligible) {
    return (
      <div className="px-5 py-2.5 bg-emerald-600/20 border-b border-emerald-600/30">
        <span className="text-sm text-emerald-300 font-medium">✓ Eligible for drops — STL {avgSTL} min avg</span>
      </div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className="px-5 py-2.5 bg-red-600/20 border-b border-red-600/30"
    >
      <span className="text-sm text-red-300 font-medium">{`✗ Not eligible — STL ${avgSTL} min avg (need under ${threshold} min)`}</span>
    </motion.div>
  );
}

function LifetimeStatsRow({ stats, paidDaysOffBank }) {
  const { totalOpened = 0, rarestWin, totalCashWon = 0, biggestWin } = stats;

  return (
    <div>
      <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Lifetime Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Opened" value={totalOpened} />
        <StatCard label="Rarest Win" value={
          rarestWin ? <Badge className={rarityBadgeClass[rarestWin]}>{rarestWin}</Badge> : '—'
        } />
        <StatCard label="Total Cash Won" value={`$${totalCashWon.toLocaleString()}`} />
        <StatCard label="Biggest Win" value={biggestWin != null ? `$${biggestWin.toLocaleString()}` : '—'} />
        <div className="bg-slate-800/60 rounded-lg px-3 py-3 border border-slate-700/40">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Days Off Banked</p>
          <div className={`text-lg font-bold mt-1 ${paidDaysOffBank?.daysAvailable > 0 ? 'text-amber-400' : 'text-white'}`}>
            {paidDaysOffBank?.daysAvailable > 0 ? `🏖️ ${paidDaysOffBank.daysAvailable}` : '0'}
          </div>
          {paidDaysOffBank && (
            <p className="text-[10px] text-slate-500 mt-0.5">{paidDaysOffBank.daysUsed} used / {paidDaysOffBank.daysEarned} earned</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-800/60 rounded-lg px-3 py-3 border border-slate-700/40">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="text-lg font-bold text-white mt-1">{value}</div>
    </div>
  );
}

function InventoryGrid({ boxes, count, cap, countColor, onOpenBox, onOpenAll, lootSettings }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider">
          Unopened Boxes (<span className={countColor}>{count}</span>/{cap})
        </h3>
        {count >= 2 && (
          <button
            onClick={onOpenAll}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-black hover:opacity-90"
            style={{ backgroundColor: '#D6FF03' }}
          >
            Open All
          </button>
        )}
      </div>

      {count === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500">
          No unopened boxes — keep booking to earn drops!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {boxes.map(box => (
            <BoxCard key={box.id} box={box} onOpen={onOpenBox} lootSettings={lootSettings} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoxCard({ box, onOpen, lootSettings }) {
  const rc = RARITY_COLORS[box.rarity] || RARITY_COLORS.common;
  const imageUrl = lootSettings ? lootSettings[`image_${box.rarity}`] : null;
  const isLegendary = box.rarity === 'legendary';
  const pulse = box.rarity === 'rare' || box.rarity === 'epic' || isLegendary;

  return (
    <motion.div
      animate={pulse ? { boxShadow: [rc.glow, rc.glowStrong, rc.glow] } : {}}
      transition={pulse ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      className="rounded-xl p-5 flex flex-col items-center gap-3"
      style={{
        background: `linear-gradient(135deg, ${rc.gradientFrom}, ${rc.gradientTo})`,
        border: `2px solid ${rc.primary}`,
        boxShadow: rc.glow,
        minHeight: 180,
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={box.rarity} className="w-16 h-16 object-contain" />
      ) : (
        <Package className="w-16 h-16 text-white opacity-90" />
      )}
      <span className="text-sm font-bold capitalize text-white">
        {box.rarity}
      </span>
      <button
        onClick={() => onOpen(box)}
        className="w-full py-1.5 text-xs font-bold rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        Open
      </button>
    </motion.div>
  );
}

function RecentWinsFeed({ wins }) {
  return (
    <div>
      <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Wins</h3>
      {wins.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-500">
          No wins yet — open a box to get started!
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {wins.map(win => (
            <div key={win.id} className="flex items-center justify-between px-3 py-2.5 bg-slate-800/50 rounded-lg border border-slate-700/30">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-white font-medium truncate">{win.prize_name}</span>
                <Badge className={`text-[10px] ${rarityBadgeClass[win.rarity]}`}>{win.rarity}</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">
                  {win.prize_type === 'cash' ? 'Cash' : 'Physical'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                {win.prize_type === 'cash' && (
                  <span className="text-sm font-bold text-emerald-400">${win.cash_value}</span>
                )}
                <span className="text-[10px] text-slate-500">
                  {win.won_date ? format(new Date(win.won_date), 'MMM d yyyy') : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}