import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, Trophy, Flame } from 'lucide-react';

function SpiffParticle({ color, left, delay, intensity }) {
  const size = 2 + Math.random() * (intensity > 80 ? 4 : 2);
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        bottom: 0,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0.8, 0],
        y: [0, -20 - Math.random() * 30, -40 - Math.random() * 20],
        x: [0, (Math.random() - 0.5) * 20],
      }}
      transition={{
        duration: 1.2 + Math.random() * 0.6,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 0.3 + Math.random() * 1,
        ease: 'easeOut',
      }}
    />
  );
}

function getBarColor(pct) {
  if (pct >= 100) return { bar: '#ff6b35', glow: 'rgba(255,107,53,0.6)', particle: '#ffaa00' };
  if (pct >= 75) return { bar: '#D6FF03', glow: 'rgba(214,255,3,0.4)', particle: '#D6FF03' };
  if (pct >= 50) return { bar: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', particle: '#a78bfa' };
  if (pct >= 25) return { bar: '#60a5fa', glow: 'rgba(96,165,250,0.2)', particle: '#93c5fd' };
  return { bar: '#475569', glow: 'rgba(71,85,105,0.1)', particle: '#64748b' };
}

export default function SpiffCard({ spiff, progress, pct, met, isSTL }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const prevMetRef = useRef(met);
  const colors = getBarColor(pct);

  // Fire on first time met transitions to true
  useEffect(() => {
    if (met && !prevMetRef.current) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3500);
      return () => clearTimeout(timer);
    }
    prevMetRef.current = met;
  }, [met]);

  const particleCount = met ? 12 : pct >= 75 ? 8 : pct >= 50 ? 4 : pct >= 25 ? 2 : 0;
  const textSize = met ? 'text-lg' : pct >= 75 ? 'text-base' : pct >= 50 ? 'text-sm' : 'text-sm';
  const rewardSize = met ? 'text-base' : pct >= 75 ? 'text-sm' : 'text-xs';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border transition-colors duration-500"
      style={{
        backgroundColor: met ? 'rgba(30,10,0,0.7)' : 'rgba(15,23,42,0.5)',
        borderColor: met ? 'rgba(255,107,53,0.5)' : 'rgba(51,65,85,0.5)',
      }}
    >
      {/* Fire background when met */}
      {met && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,69,0,0.15) 0%, rgba(255,170,0,0.08) 50%, transparent 100%)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
            style={{ background: 'linear-gradient(0deg, rgba(255,100,0,0.25) 0%, rgba(255,170,0,0.1) 40%, transparent 100%)' }}
            animate={{ y: [0, -3, 1, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Fire border glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{ boxShadow: 'inset 0 0 20px rgba(255,100,0,0.3), 0 0 15px rgba(255,100,0,0.2)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </>
      )}

      {/* SUCCESS overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl"
          >
            <motion.div
              className="flex flex-col items-center"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
              </motion.div>
              <motion.span
                className="text-2xl font-black mt-2"
                animate={{ color: ['#FFD700', '#ff6b35', '#FFD700'], textShadow: ['0 0 10px rgba(255,215,0,0.5)', '0 0 20px rgba(255,107,53,0.8)', '0 0 10px rgba(255,215,0,0.5)'] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                SUCCESS!
              </motion.span>
              <span className="text-xs text-amber-300 mt-1">Spiff Completed!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {met ? (
              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <Flame className="w-4 h-4 text-orange-400" />
              </motion.div>
            ) : (
              <Gift className="w-4 h-4 text-purple-400" />
            )}
            <span className={`${textSize} font-bold ${met ? 'text-orange-200' : 'text-white'}`}>{spiff.title}</span>
          </div>
          {spiff.reward && (
            <motion.span
              className={`${rewardSize} font-bold px-2 py-0.5 rounded-full`}
              style={{
                backgroundColor: met ? 'rgba(255,107,53,0.2)' : 'rgba(139,92,246,0.15)',
                color: met ? '#ffaa00' : '#c084fc',
              }}
              animate={met ? { scale: [1, 1.08, 1], textShadow: ['0 0 4px rgba(255,170,0,0.4)', '0 0 10px rgba(255,170,0,0.8)', '0 0 4px rgba(255,170,0,0.4)'] } : {}}
              transition={met ? { duration: 1.2, repeat: Infinity } : {}}
            >
              {spiff.reward}
            </motion.span>
          )}
        </div>

        {spiff.description && <p className="text-[11px] text-slate-400 mb-2">{spiff.description}</p>}

        {/* Progress text */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`${pct >= 75 ? 'text-sm font-bold' : 'text-xs font-medium'} ${met ? 'text-orange-300' : 'text-slate-300'}`}>
            {isSTL ? `${progress ?? '—'}m avg` : `${progress} / ${spiff.goal_value}`}
            {isSTL ? ` (goal: ≤${spiff.goal_value}m)` : ` ${spiff.qualifier}`}
          </span>
          <span className={`text-xs font-bold ${met ? 'text-orange-400' : 'text-slate-400'}`}>
            {Math.round(pct)}%
          </span>
        </div>

        {/* Progress bar with particles */}
        <div className="relative h-3 bg-slate-700/60 rounded-full overflow-visible">
          {/* Particle layer */}
          <div className="absolute inset-0 overflow-visible">
            {Array.from({ length: particleCount }).map((_, i) => (
              <SpiffParticle
                key={i}
                color={met ? (Math.random() > 0.5 ? '#ff6b35' : '#ffaa00') : colors.particle}
                left={Math.min(pct, 100) * (0.7 + Math.random() * 0.3)}
                delay={i * 0.15}
                intensity={pct}
              />
            ))}
          </div>

          {/* Bar fill */}
          <motion.div
            className="h-full rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              backgroundColor: colors.bar,
              boxShadow: `0 0 ${pct >= 50 ? 12 : 6}px ${colors.glow}, inset 0 1px 1px rgba(255,255,255,0.15)`,
            }}
          >
            {/* Shimmer on bar */}
            {pct >= 25 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>

        {/* Due date */}
        {spiff.due_date && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
            <Clock className="w-2.5 h-2.5" />
            <span>Due {new Date(spiff.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}

        {met && (
          <motion.div
            className="mt-2 text-center"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-xs font-bold text-orange-400">🔥 Goal Crushed! 🔥</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}