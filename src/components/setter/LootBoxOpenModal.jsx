import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RARITY_COLORS = {
  common: { primary: '#94a3b8', gradientFrom: '#334155', gradientTo: '#1e293b', glow: '0 0 30px #94a3b840', glowStrong: '0 0 60px #94a3b860' },
  rare: { primary: '#60a5fa', gradientFrom: '#1e3a5f', gradientTo: '#1e3a8a', glow: '0 0 60px #60a5fa80', glowStrong: '0 0 120px #60a5faaa' },
  epic: { primary: '#a855f7', gradientFrom: '#3b0764', gradientTo: '#581c87', glow: '0 0 80px #a855f7aa', glowStrong: '0 0 160px #a855f7cc' },
  legendary: { primary: '#fbbf24', gradientFrom: '#1c1400', gradientTo: '#78350f', glow: '0 0 100px #fbbf24bb', glowStrong: '0 0 200px #fbbf24dd' },
};

function getTiledBgStyle(primaryColor) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20 0L40 20L20 40L0 20Z' fill='${primaryColor}' fill-opacity='0.1'/></svg>`;
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    backgroundRepeat: 'repeat',
    backgroundSize: '40px 40px',
  };
}

function BoxVisual({ rarity, rc, imageUrl, size = 'large' }) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 'w-32 h-32' : 'w-16 h-16';
  const imgSize = isLarge ? 'w-40 h-40' : 'w-20 h-20';

  return imageUrl ? (
    <img src={imageUrl} alt={rarity} className={`${imgSize} object-contain`} />
  ) : (
    <Package className={`${iconSize} text-white opacity-90`} />
  );
}

export default function LootBoxOpenModal({ box, open, onClose, onOpened, setterId, lootSettings }) {
  const [stage, setStage] = useState('opening');
  const [prize, setPrize] = useState(null);
  const [lootWin, setLootWin] = useState(null);
  const backendDone = useRef(false);
  const backendResult = useRef(null);

  useEffect(() => {
    if (open && box) {
      setStage('opening');
      setPrize(null);
      setLootWin(null);
      backendDone.current = false;
      backendResult.current = null;
    }
  }, [open, box?.id]);

  const rc = box ? RARITY_COLORS[box.rarity] || RARITY_COLORS.common : RARITY_COLORS.common;
  const imageUrl = box && lootSettings ? lootSettings[`image_${box.rarity}`] : null;

  const handleOpenNow = () => setStage('shaking');

  const handleShakeComplete = () => {
    setStage('revealing');
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

  const modalBg = box.rarity === 'legendary' ? 'bg-black/95' : 'bg-black/90';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div className={`absolute inset-0 ${modalBg}`} />
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
            {stage === 'opening' && (
              <OpeningStage rc={rc} rarity={box.rarity} imageUrl={imageUrl} onOpen={handleOpenNow} onClose={onClose} />
            )}
            {stage === 'shaking' && (
              <ShakingStage rc={rc} rarity={box.rarity} imageUrl={imageUrl} onComplete={handleShakeComplete} />
            )}
            {stage === 'revealing' && (
              <RevealingStage rc={rc} rarity={box.rarity} imageUrl={imageUrl} prize={prize} onComplete={handleRevealComplete} />
            )}
            {stage === 'done' && (
              <DoneStage rc={rc} rarity={box.rarity} prize={prize} lootWin={lootWin} onClose={onClose} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──── PARTICLES ──── */
function FloatingParticles({ rarity, rc }) {
  if (rarity === 'common' || rarity === 'rare') return null;

  const count = rarity === 'legendary' ? 16 : 8;
  const colorClass = rarity === 'legendary' ? 'bg-amber-400' : 'bg-purple-400';
  const duration = rarity === 'legendary' ? 1.5 : 2;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const size = rarity === 'legendary' ? (i % 2 === 0 ? 8 : 4) : 6;
        const xOffset = rarity === 'legendary' ? -120 + Math.random() * 240 : -80 + Math.random() * 160;
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full ${colorClass}`}
            style={{
              width: size,
              height: size,
              bottom: 0,
              left: '50%',
              marginLeft: xOffset,
            }}
            animate={{ y: rarity === 'legendary' ? -120 : -80, opacity: 0 }}
            transition={{ duration, repeat: Infinity, delay: i * (duration / count), ease: 'easeOut' }}
          />
        );
      })}
    </>
  );
}

function LegendaryBackGlow() {
  return (
    <div className="absolute w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
  );
}

/* ──── OPENING STAGE ──── */
function OpeningStage({ rc, rarity, imageUrl, onOpen, onClose }) {
  const pulse = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';
  const pulseStrong = rarity === 'epic' || rarity === 'legendary';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8 relative"
    >
      {rarity === 'legendary' && <LegendaryBackGlow />}
      <div className="relative">
        <motion.div
          animate={
            pulse
              ? { boxShadow: [rc.glow, rc.glowStrong, rc.glow] }
              : {}
          }
          transition={pulse ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          className="w-[280px] h-[280px] rounded-2xl flex flex-col items-center justify-center gap-3 relative"
          style={{
            background: `linear-gradient(135deg, ${rc.gradientFrom}, ${rc.gradientTo})`,
            border: `2px solid ${rc.primary}`,
            boxShadow: rarity === 'common' ? rc.glow : rc.glowStrong,
          }}
        >
          <BoxVisual rarity={rarity} rc={rc} imageUrl={imageUrl} size="large" />
          <span className="text-sm font-bold capitalize text-white">{rarity}</span>
        </motion.div>
        <FloatingParticles rarity={rarity} rc={rc} />
      </div>
      <div className="flex gap-3 relative z-10">
        <button
          onClick={onOpen}
          className="px-8 py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: rc.primary }}
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

/* ──── SHAKING STAGE ──── */
function ShakingStage({ rc, rarity, imageUrl, onComplete }) {
  return (
    <div className="relative flex items-center justify-center">
      {rarity === 'legendary' && <LegendaryBackGlow />}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ x: [0, -12, 12, -10, 10, -6, 6, 0] }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onAnimationComplete={onComplete}
        className="w-[280px] h-[280px] rounded-2xl flex flex-col items-center justify-center gap-3 relative"
        style={{
          background: `linear-gradient(135deg, ${rc.gradientFrom}, ${rc.gradientTo})`,
          border: `2px solid ${rc.primary}`,
          boxShadow: rc.glowStrong,
        }}
      >
        <BoxVisual rarity={rarity} rc={rc} imageUrl={imageUrl} size="large" />
        <span className="text-sm font-bold capitalize text-white">{rarity}</span>
      </motion.div>
      <FloatingParticles rarity={rarity} rc={rc} />
    </div>
  );
}

/* ──── REVEALING STAGE ──── */
function PrizeCard({ rc, rarity, prize, children }) {
  const bannerBg = rarity === 'common' ? '#475569' : rc.primary;

  return (
    <div
      className="w-[320px] rounded-2xl overflow-hidden relative"
      style={{
        height: 480,
        border: `2px solid ${rc.primary}`,
        boxShadow: rc.glowStrong,
      }}
    >
      {/* Tiled diamond background layer */}
      <div className="absolute inset-0" style={getTiledBgStyle(rc.primary)} />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${rc.gradientFrom}dd, ${rc.gradientTo}dd)` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Rarity banner */}
        <div className="py-2.5 text-center font-black text-sm uppercase tracking-widest text-black shrink-0" style={{ backgroundColor: bannerBg }}>
          {rarity}
        </div>

        {/* Box icon placeholder */}
        <div className="flex items-center justify-center py-8 shrink-0">
          <Package className="w-16 h-16 text-white opacity-80" />
        </div>

        {/* Divider */}
        <div className="mx-6 h-px shrink-0" style={{ backgroundColor: rc.primary, opacity: 0.2 }} />

        {/* Prize content area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
          {prize !== null ? (
            <>
              <p className="text-xl font-bold text-white">{prize.name}</p>
              <p className="text-sm text-slate-400">{prize.description}</p>
              {prize.prize_type === 'cash' && prize.cash_value > 0 ? (
                <p className="text-4xl font-black mt-2" style={{ color: rc.primary }}>${prize.cash_value}</p>
              ) : (
                <Gift className="w-12 h-12 mt-2" style={{ color: rc.primary }} />
              )}
              <p className="text-xs text-slate-400 mt-1">Prize Unlocked!</p>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="h-5 w-40 rounded-full bg-white/10"
              />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                className="h-3 w-28 rounded-full bg-white/10"
              />
            </div>
          )}
        </div>

        {/* Bottom action area */}
        {children && <div className="px-6 pb-5 shrink-0">{children}</div>}
      </div>
    </div>
  );
}

function RevealingStage({ rc, rarity, imageUrl, prize, onComplete }) {
  const [boxGone, setBoxGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBoxGone(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 360, height: 520 }}>
      {/* Box shrinking away */}
      {!boxGone && (
        <motion.div
          initial={{ scale: 1.2, opacity: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeIn' }}
          className="absolute w-[200px] h-[200px] rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${rc.gradientFrom}, ${rc.gradientTo})`,
            border: `2px solid ${rc.primary}`,
            boxShadow: rc.glowStrong,
          }}
        >
          <BoxVisual rarity={rarity} rc={rc} imageUrl={imageUrl} size="large" />
          <span className="text-sm font-bold capitalize text-white">{rarity}</span>
        </motion.div>
      )}

      {/* Particle burst — radiates from center into dark bg */}
      {boxGone && <ParticleBurst rc={rc} rarity={rarity} />}

      {/* Prize card */}
      {boxGone && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          onAnimationComplete={onComplete}
          className="absolute z-10"
        >
          <PrizeCard rc={rc} rarity={rarity} prize={prize} />
        </motion.div>
      )}
    </div>
  );
}

/* ──── DONE STAGE ──── */
function DoneStage({ rc, rarity, prize, onClose }) {
  const claimBg = rarity === 'common' ? '#475569' : rc.primary;

  return (
    <div className="relative flex items-center justify-center w-full" style={{ minHeight: 520 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10"
      >
        <PrizeCard rc={rc} rarity={rarity} prize={prize}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: claimBg }}
          >
            Claim
          </button>
        </PrizeCard>
      </motion.div>
    </div>
  );
}

/* ──── PARTICLE BURST ──── */
function ParticleBurst({ rc, rarity }) {
  const count = rarity === 'legendary' ? 20 : 12;
  const dist = rarity === 'legendary' ? 300 : 200;

  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const r = dist * 0.6 + Math.random() * dist * 0.4;
    return { id: i, x: Math.cos(angle) * r, y: Math.sin(angle) * r };
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
            width: 16,
            height: 16,
            backgroundColor: rc.primary,
            top: '50%',
            left: '50%',
            marginTop: -8,
            marginLeft: -8,
          }}
        />
      ))}
    </>
  );
}