import React, { useEffect, useState } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CelebrationOverlay({ type, rarity, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 500);
    }, type === 'rank_up' ? 4000 : type === 'loot_drop' ? 2800 : 2500);
    return () => clearTimeout(timer);
  }, [type, onDone]);

  if (type === 'rank_up') {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background flash */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.15, 0.3, 0.1] }}
              transition={{ duration: 2, times: [0, 0.1, 0.3, 0.5, 1] }}
              style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,165,0,0.1) 50%, transparent 80%)' }}
            />

            {/* Gold particles */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4 + Math.random() * 8,
                  height: 4 + Math.random() * 8,
                  background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FFA500' : '#FFEC8B',
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0],
                  y: [0, -60 - Math.random() * 120, -100 - Math.random() * 200],
                  x: [-30 + Math.random() * 60],
                }}
                transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.5, ease: 'easeOut' }}
              />
            ))}

            {/* Main content */}
            <motion.div
              className="relative flex flex-col items-center gap-3"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.2, 1], rotate: [-10, 5, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Glowing ring */}
              <motion.div
                className="absolute -inset-12 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: 2, ease: 'easeInOut' }}
              />

              <motion.div
                className="relative"
                animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
              >
                <Trophy className="w-20 h-20 text-yellow-300 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
              </motion.div>

              <motion.p
                className="text-3xl font-black text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                #1 RANKED!
              </motion.p>

              <motion.p
                className="text-sm font-medium text-amber-200/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                You've taken the top spot! 🔥
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (type === 'loot_drop') {
    const rarityConfig = {
      common:    { color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', label: 'COMMON' },
      rare:      { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)',  label: 'RARE' },
      epic:      { color: '#a855f7', glow: 'rgba(168,85,247,0.5)',  label: 'EPIC' },
      legendary: { color: '#fbbf24', glow: 'rgba(251,191,36,0.6)',  label: 'LEGENDARY' },
    }[rarity] || { color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', label: 'COMMON' };

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background glow */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.15] }}
              transition={{ duration: 1.2 }}
              style={{ background: `radial-gradient(circle, ${rarityConfig.glow} 0%, transparent 70%)` }}
            />

            {/* Burst particles */}
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * Math.PI * 2;
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ width: 6, height: 6, background: rarityConfig.color, left: '50%', top: '50%' }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * (80 + Math.random() * 80),
                    y: Math.sin(angle) * (80 + Math.random() * 80),
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
                />
              );
            })}

            {/* Main content */}
            <motion.div
              className="relative flex flex-col items-center gap-3"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-5, 5, -5, 0] }}
                transition={{ duration: 0.8, repeat: 1 }}
                style={{ fontSize: '4rem', lineHeight: 1 }}
              >
                🎁
              </motion.div>

              <motion.p
                className="text-2xl font-black"
                style={{ color: rarityConfig.color, textShadow: `0 0 20px ${rarityConfig.glow}` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                LOOT DROP!
              </motion.p>

              <motion.span
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: rarityConfig.color, border: `1px solid ${rarityConfig.color}`, background: `${rarityConfig.glow}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {rarityConfig.label}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Booking celebration
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Quick flash */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0] }}
            transition={{ duration: 0.8 }}
            style={{ background: 'radial-gradient(circle, rgba(214,255,3,0.3) 0%, transparent 70%)' }}
          />

          {/* Burst particles */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: i % 2 === 0 ? '#D6FF03' : '#22c55e',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(angle) * (80 + Math.random() * 60),
                  y: Math.sin(angle) * (80 + Math.random() * 60),
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
              />
            );
          })}

          {/* Main content */}
          <motion.div
            className="relative flex flex-col items-center gap-2"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: 1 }}
            >
              <Calendar className="w-14 h-14 drop-shadow-[0_0_12px_rgba(214,255,3,0.6)]" style={{ color: '#D6FF03' }} />
            </motion.div>

            <motion.p
              className="text-xl font-black"
              style={{ color: '#D6FF03' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              BOOKED! 🎯
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}