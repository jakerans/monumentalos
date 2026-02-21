import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RARITY_COLORS = {
  common: '#94a3b8',
  rare: '#60a5fa',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

export default function LootBoxOpenModal({ box, open, onClose, onOpened, setterId }) {
  const [stage, setStage] = useState('opening');
  const [prize, setPrize] = useState(null);
  const [lootWin, setLootWin] = useState(null);
  const backendDone = useRef(false);
  const backendResult = useRef(null);

  // Reset state when box changes
  useEffect(() => {
    if (open && box) {
      setStage('opening');
      setPrize(null);
      setLootWin(null);
      backendDone.current = false;
      backendResult.current = null;
    }
  }, [open, box?.id]);

  const color = box ? RARITY_COLORS[box.rarity] || RARITY_COLORS.common : RARITY_COLORS.common;

  const handleOpenNow = () => {
    setStage('shaking');
  };

  const handleShakeComplete = () => {
    setStage('revealing');
    // Fire backend call
    base44.functions.invoke('openLootBox', { loot_box_id: box.id, setter_id: setterId })
      .then(res => {
        backendResult.current = res.data;
        backendDone.current = true;
        setPrize(res.data.prize);
        setLootWin(res.data.lootWin);
      })
      .catch((err) => {
        console.error('openLootBox error:', err);
        backendDone.current = true;
        setPrize({ name: 'Error — Contact Manager', description: err?.message || 'Something went wrong opening this box', prize_type: 'physical', cash_value: 0 });
      });
  };

  const handleRevealComplete = useCallback(() => {
    const check = () => {
      if (backendDone.current) {
        setStage('done');
        if (backendResult.current?.lootWin && onOpened) {
          onOpened(backendResult.current.lootWin);
        }
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }, [onOpened]);

  if (!open || !box) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/90" />
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
            {stage === 'opening' && (
              <OpeningStage color={color} rarity={box.rarity} onOpen={handleOpenNow} onClose={onClose} />
            )}
            {stage === 'shaking' && (
              <ShakingStage color={color} rarity={box.rarity} onComplete={handleShakeComplete} />
            )}
            {stage === 'revealing' && (
              <RevealingStage color={color} rarity={box.rarity} prize={prize} onComplete={handleRevealComplete} />
            )}
            {stage === 'done' && (
              <DoneStage color={color} rarity={box.rarity} prize={prize} lootWin={lootWin} onClose={onClose} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OpeningStage({ color, rarity, onOpen, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <motion.div
        animate={{ scale: [1.0, 1.08, 1.0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-[200px] h-[200px] rounded-2xl flex items-center justify-center border-2"
        style={{
          borderColor: color,
          boxShadow: `0 0 40px ${color}40, 0 0 80px ${color}20`,
          background: `radial-gradient(circle at center, ${color}15, transparent 70%)`,
        }}
      >
        <span className="text-3xl font-black capitalize" style={{ color }}>{rarity}</span>
      </motion.div>
      <div className="flex gap-3">
        <button
          onClick={onOpen}
          className="px-8 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Open Now
        </button>
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-xl text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-slate-700 transition-colors"
        >
          Save for Later
        </button>
      </div>
    </motion.div>
  );
}

function ShakingStage({ color, rarity, onComplete }) {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ x: [0, -12, 12, -10, 10, -6, 6, 0] }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      onAnimationComplete={onComplete}
      className="w-[200px] h-[200px] rounded-2xl flex items-center justify-center border-2"
      style={{
        borderColor: color,
        boxShadow: `0 0 60px ${color}60, 0 0 120px ${color}30`,
        background: `radial-gradient(circle at center, ${color}25, transparent 70%)`,
      }}
    >
      <span className="text-3xl font-black capitalize" style={{ color }}>{rarity}</span>
    </motion.div>
  );
}

function RevealingStage({ color, rarity, prize, onComplete }) {
  const [boxGone, setBoxGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBoxGone(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 360, height: 400 }}>
      {/* Box shrinking away */}
      {!boxGone && (
        <motion.div
          initial={{ scale: 1.2, opacity: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeIn' }}
          className="absolute w-[200px] h-[200px] rounded-2xl flex items-center justify-center border-2"
          style={{ borderColor: color, boxShadow: `0 0 60px ${color}60` }}
        >
          <span className="text-3xl font-black capitalize" style={{ color }}>{rarity}</span>
        </motion.div>
      )}

      {/* Particle burst */}
      {boxGone && <ParticleBurst color={color} />}

      {/* Prize card */}
      {boxGone && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          onAnimationComplete={onComplete}
          className="absolute w-full max-w-xs bg-slate-900 rounded-2xl border overflow-hidden shadow-2xl"
          style={{ borderColor: `${color}60`, boxShadow: `0 0 40px ${color}30` }}
        >
          {/* Rarity banner */}
          <div className="py-2.5 text-center font-black text-sm uppercase tracking-widest text-black" style={{ backgroundColor: color }}>
            {rarity}
          </div>
          <div className="p-6 flex flex-col items-center text-center gap-3">
            {prize !== null ? (
              <>
                <p className="text-xl font-bold text-white">{prize.name}</p>
                <p className="text-sm text-slate-400">{prize.description}</p>
                {prize.prize_type === 'cash' && prize.cash_value > 0 ? (
                  <p className="text-4xl font-black mt-2" style={{ color }}>${prize.cash_value}</p>
                ) : (
                  <Gift className="w-12 h-12 mt-2" style={{ color }} />
                )}
              </>
            ) : (
              <div className="py-6 w-full flex flex-col items-center gap-3">
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-5 w-40 rounded-full bg-slate-700"
                />
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                  className="h-3 w-28 rounded-full bg-slate-700"
                />
              </div>
            )}
            {prize !== null && <p className="text-xs text-slate-500 mt-1">Prize Unlocked!</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DoneStage({ color, rarity, prize, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-xs bg-slate-900 rounded-2xl border overflow-hidden shadow-2xl"
      style={{ borderColor: `${color}60`, boxShadow: `0 0 40px ${color}30` }}
    >
      <div className="py-2.5 text-center font-black text-sm uppercase tracking-widest text-black" style={{ backgroundColor: color }}>
        {rarity}
      </div>
      <div className="p-6 flex flex-col items-center text-center gap-3">
        {prize !== null ? (
          <>
            <p className="text-xl font-bold text-white">{prize.name}</p>
            <p className="text-sm text-slate-400">{prize.description}</p>
            {prize.prize_type === 'cash' && prize.cash_value > 0 ? (
              <p className="text-4xl font-black mt-2" style={{ color }}>${prize.cash_value}</p>
            ) : (
              <Gift className="w-12 h-12 mt-2" style={{ color }} />
            )}
          </>
        ) : (
          <div className="py-4 w-full flex flex-col items-center gap-3">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-5 w-40 rounded-full bg-slate-700"
            />
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
              className="h-3 w-28 rounded-full bg-slate-700"
            />
          </div>
        )}
        <p className="text-xs text-slate-500 mt-1">Prize Unlocked!</p>
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Claim
        </button>
      </div>
    </motion.div>
  );
}

function ParticleBurst({ color }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 80 + Math.random() * 60;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: 6 + Math.random() * 6,
    };
  });

  return (
    <>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            top: '50%',
            left: '50%',
            marginTop: -p.size / 2,
            marginLeft: -p.size / 2,
          }}
        />
      ))}
    </>
  );
}