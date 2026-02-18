import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, Flame, Skull } from 'lucide-react';

// Floating particles component
function STLParticles({ count = 8, color = '#4ade80' }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 20,
    })), [count, color]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: 0,
            backgroundColor: color,
            opacity: 0,
          }}
          animate={{
            y: [-10, -60 - Math.random() * 40],
            x: [0, p.drift],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function getSTLState(minutes) {
  if (minutes <= 0) return 'none';
  if (minutes < 1) return 'fire';      // under 1 min — on fire
  if (minutes <= 5) return 'green';     // 1-5 min — glowing green
  if (minutes <= 15) return 'yellow';   // 5-15 — transitioning
  if (minutes <= 30) return 'orange';   // 15-30 — getting warm
  if (minutes <= 60) return 'red';      // 30-60 — warning
  return 'critical';                     // 60+ — very bad
}

function getGlowStyle(state) {
  switch (state) {
    case 'fire': return {
      border: '1px solid rgba(255, 107, 53, 0.6)',
      boxShadow: '0 0 12px rgba(255, 69, 0, 0.4), 0 0 30px rgba(255, 140, 0, 0.2), inset 0 0 20px rgba(255, 69, 0, 0.15)',
      background: 'linear-gradient(135deg, rgba(255,69,0,0.1) 0%, rgba(255,140,0,0.08) 50%, rgba(139,69,19,0.05) 100%)',
    };
    case 'green': return {
      border: '1px solid rgba(74, 222, 128, 0.4)',
      boxShadow: '0 0 10px rgba(74, 222, 128, 0.25), 0 0 25px rgba(74, 222, 128, 0.1), inset 0 0 15px rgba(74, 222, 128, 0.08)',
      background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(34,197,94,0.04) 100%)',
    };
    case 'yellow': return {
      border: '1px solid rgba(250, 204, 21, 0.3)',
      boxShadow: '0 0 8px rgba(250, 204, 21, 0.15), inset 0 0 10px rgba(250,204,21,0.05)',
      background: 'linear-gradient(135deg, rgba(250,204,21,0.06) 0%, rgba(234,179,8,0.03) 100%)',
    };
    case 'orange': return {
      border: '1px solid rgba(251, 146, 60, 0.4)',
      boxShadow: '0 0 8px rgba(251, 146, 60, 0.2), inset 0 0 12px rgba(251,146,60,0.08)',
      background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(239,68,68,0.04) 100%)',
    };
    case 'red': return {
      border: '1px solid rgba(239, 68, 68, 0.5)',
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(239,68,68,0.1)',
      background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(185,28,28,0.06) 100%)',
    };
    case 'critical': return {
      border: '1px solid rgba(220, 38, 38, 0.6)',
      boxShadow: '0 0 15px rgba(220, 38, 38, 0.4), 0 0 35px rgba(220,38,38,0.2), inset 0 0 20px rgba(220,38,38,0.15)',
      background: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(127,29,29,0.08) 100%)',
    };
    default: return {
      border: '1px solid rgba(71,85,105,0.5)',
      background: 'transparent',
    };
  }
}

function getIconColor(state) {
  switch (state) {
    case 'fire': return '#ff6b35';
    case 'green': return '#4ade80';
    case 'yellow': return '#facc15';
    case 'orange': return '#fb923c';
    case 'red': return '#ef4444';
    case 'critical': return '#dc2626';
    default: return '#94a3b8';
  }
}

export default function STLStatusWidget({ avgSTL = 0, teamAvgSTL = 0, sparkData = [], className = '' }) {
  const state = getSTLState(avgSTL);
  const glowStyle = getGlowStyle(state);
  const iconColor = getIconColor(state);

  const isFire = state === 'fire';
  const isGreen = state === 'green';
  const isWarning = state === 'red' || state === 'critical';
  const isCritical = state === 'critical';
  const showBreathing = state === 'orange' || state === 'red' || state === 'critical';

  const displayValue = avgSTL > 0
    ? (avgSTL < 1 ? `${Math.round(avgSTL * 60)}s` : `${Math.round(avgSTL * 10) / 10}m`)
    : '—';

  return (
    <motion.div
      className={`relative rounded-lg p-3 overflow-hidden ${className}`}
      style={glowStyle}
      animate={isFire ? {
        x: [0, -1, 1, -0.5, 0.5, 0],
        scale: [1, 1.01, 0.99, 1.005, 1],
      } : showBreathing ? {
        boxShadow: [
          glowStyle.boxShadow,
          glowStyle.boxShadow.replace(/0\.\d+/g, (m) => String(Math.min(parseFloat(m) * 1.5, 1))),
          glowStyle.boxShadow,
        ],
      } : {}}
      transition={isFire ? {
        duration: 0.3,
        repeat: Infinity,
        repeatType: 'mirror',
      } : showBreathing ? {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      } : {}}
    >
      {/* Fire particles */}
      {isFire && <STLParticles count={12} color="#ff6b35" />}
      {isFire && <STLParticles count={6} color="#ffaa00" />}

      {/* Green particles */}
      {isGreen && <STLParticles count={8} color="#4ade80" />}

      {/* Red breathing overlay */}
      {showBreathing && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          animate={{ opacity: [0.03, 0.1, 0.03] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: isCritical ? '#dc2626' : '#ef4444' }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-tight">Avg STL</p>
          <div className="p-1 rounded-md" style={{ backgroundColor: `${iconColor}15` }}>
            {isFire ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Flame className="w-3.5 h-3.5" style={{ color: iconColor }} />
              </motion.div>
            ) : isCritical ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Skull className="w-3.5 h-3.5" style={{ color: iconColor }} />
              </motion.div>
            ) : (
              <Zap className="w-3.5 h-3.5" style={{ color: iconColor }} />
            )}
          </div>
        </div>

        {/* Value */}
        <motion.p
          className="text-xl font-bold leading-tight"
          style={{ color: isFire ? '#ff6b35' : isGreen ? '#4ade80' : state === 'yellow' ? '#facc15' : state === 'orange' ? '#fb923c' : isWarning ? '#ef4444' : '#fff' }}
          animate={isFire ? {
            textShadow: [
              '0 0 8px rgba(255,107,53,0.5)',
              '0 0 16px rgba(255,140,0,0.7)',
              '0 0 8px rgba(255,107,53,0.5)',
            ]
          } : {}}
          transition={isFire ? { duration: 1, repeat: Infinity } : {}}
        >
          {displayValue}
        </motion.p>

        {/* Team comparison */}
        {teamAvgSTL > 0 && (
          <div className="flex items-center gap-1.5 mt-1 min-h-[16px]">
            <span className="text-[10px] text-slate-500">
              Team: <span className="font-medium text-slate-400">{teamAvgSTL}m</span>
            </span>
          </div>
        )}

        {/* Warning text */}
        <AnimatePresence>
          {state === 'red' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1 mt-1.5"
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Slow — pick it up!</span>
            </motion.div>
          )}
          {isCritical && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: [0.7, 1, 0.7], y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ opacity: { duration: 1.2, repeat: Infinity } }}
              className="flex items-center gap-1 mt-1.5"
            >
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">Critical — respond now!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}