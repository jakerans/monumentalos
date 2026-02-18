import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';

// Continuous arcade power bar: particles start at T1 and ramp up through T2 to T3.
// intensity is a 0→1 float mapped from T1 threshold to T3 threshold.

function FlameParticle({ x, delay, size, intensity }) {
  // Color shifts from cyan/teal at low intensity → orange → red/white at max
  const colorBands = [
    ['#22d3ee', '#06b6d4', '#67e8f9'],           // 0–0.2 cyan
    ['#a78bfa', '#c084fc', '#e879f9'],           // 0.2–0.4 purple
    ['#fbbf24', '#f59e0b', '#fcd34d'],           // 0.4–0.6 amber
    ['#ff6b35', '#ffaa00', '#f97316'],           // 0.6–0.8 orange
    ['#ff4500', '#ff2d2d', '#fff176', '#ffaa00'], // 0.8–1.0 red/fire
  ];
  const bandIdx = Math.min(4, Math.floor(intensity * 5));
  const colors = colorBands[bandIdx];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const reach = 8 + intensity * 28;
  const opacity = 0.4 + intensity * 0.6;
  const scale = 0.8 + intensity * 0.7;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`, bottom: 0, width: size, height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        filter: `blur(${1.5 - intensity * 0.5}px)`,
      }}
      animate={{
        y: [0, -reach - Math.random() * reach * 0.5],
        x: [0, (Math.random() - 0.5) * (8 + intensity * 8)],
        opacity: [0, opacity, 0],
        scale: [0.2, scale, 0],
      }}
      transition={{
        duration: 1.2 - intensity * 0.5 + Math.random() * 0.4,
        repeat: Infinity, delay, ease: 'easeOut',
      }}
    />
  );
}

function EmberParticle({ delay, intensity }) {
  const x = 10 + Math.random() * 80;
  const color = intensity > 0.7 ? '#ffaa00' : intensity > 0.4 ? '#fbbf24' : '#a78bfa';
  const glowColor = intensity > 0.7 ? '#ff6b35' : intensity > 0.4 ? '#f59e0b' : '#8b5cf6';
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{
        left: `${x}%`, bottom: 0,
        backgroundColor: color,
        boxShadow: `0 0 4px ${glowColor}`,
      }}
      animate={{
        y: [0, -30 - intensity * 30 - Math.random() * 20],
        x: [0, (Math.random() - 0.5) * 20],
        opacity: [0, 1, 0],
        scale: [0.5, 0.8, 0],
      }}
      transition={{ duration: 1.2 + Math.random() * 0.6, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export default function ArcadeOverheatMeter({ fillPct, topped, tierIdx = -1 }) {
  const uid = useId();
  const clampedPct = Math.max(2, Math.min(fillPct, 100));

  const isT3 = tierIdx >= 2 || topped;
  const hasParticles = tierIdx >= 0;

  // Continuous intensity: 0 at T1 threshold (50% of bar), 1 at T3 (100% of bar)
  // Maps 50→100 fill pct to 0→1 intensity
  const intensity = hasParticles ? Math.min(1, Math.max(0, (clampedPct - 50) / 50)) : 0;

  // Particle count scales with intensity: 2 at start → 14 at max
  const flameCount = hasParticles ? Math.round(2 + intensity * 12) : 0;
  const emberCount = intensity > 0.3 ? Math.round(intensity * 6) : 0;

  const w = 72;
  const h = 80;
  const barX = 10;
  const barW = w - 20;
  const barY = 6;
  const barH = h - 12;
  const fillH = (clampedPct / 100) * barH;
  const fillY = barY + barH - fillH;
  const ticks = [0, 25, 50, 75, 100];

  // Gradient colors ramp continuously with intensity
  const fillBottom = isT3 ? '#ff2d2d'
    : intensity > 0.6 ? '#f97316'
    : intensity > 0.3 ? '#f59e0b'
    : intensity > 0 ? '#8b5cf6'
    : '#0ea5e9';
  const fillMid = isT3 ? '#ff6b35'
    : intensity > 0.6 ? '#ffaa00'
    : intensity > 0.3 ? '#fbbf24'
    : intensity > 0 ? '#a78bfa'
    : '#38bdf8';
  const fillTop = isT3 ? '#ffaa00'
    : intensity > 0.6 ? '#fcd34d'
    : intensity > 0.3 ? '#fde68a'
    : intensity > 0 ? '#c4b5fd'
    : '#7dd3fc';

  const glowColor = isT3 ? 'rgba(255,45,45,0.6)'
    : intensity > 0.6 ? 'rgba(249,115,22,0.4)'
    : intensity > 0.3 ? 'rgba(245,158,11,0.35)'
    : intensity > 0 ? 'rgba(139,92,246,0.35)'
    : 'rgba(14,165,233,0.25)';

  // Stable flame positions
  const flamePositions = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      x: 8 + (i / 14) * 84,
      delay: i * 0.09 + (i * 17 % 7) * 0.04,
      sizeBase: 3 + (i * 13 % 5),
    }));
  }, []);

  const emberDelays = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => 0.2 + i * 0.18);
  }, []);

  return (
    <div className="relative" style={{ width: w, height: h + (isT3 ? 16 : hasParticles ? 6 + intensity * 6 : 0) }}>
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-xl pointer-events-none"
        style={{ inset: -4 }}
        animate={isT3 ? {
          boxShadow: [`0 0 25px ${glowColor}`, `0 0 40px rgba(255,45,45,0.7)`, `0 0 25px ${glowColor}`],
        } : {
          boxShadow: [`0 0 ${6 + intensity * 10}px ${glowColor}`, `0 0 ${10 + intensity * 14}px ${glowColor}`, `0 0 ${6 + intensity * 10}px ${glowColor}`],
        }}
        transition={{ duration: isT3 ? 0.4 : 2 - intensity * 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Flame particles — continuous from T1 onward */}
      {hasParticles && (
        <div className="absolute overflow-visible pointer-events-none"
          style={{ left: barX, width: barW, bottom: h - fillY + (isT3 ? 8 : 0), height: 35 }}>
          {flamePositions.slice(0, flameCount).map((fp, i) => (
            <FlameParticle
              key={`f${i}`}
              x={fp.x}
              delay={fp.delay}
              size={fp.sizeBase + intensity * 5}
              intensity={intensity}
            />
          ))}
          {emberDelays.slice(0, emberCount).map((d, i) => (
            <EmberParticle key={`e${i}`} delay={d} intensity={intensity} />
          ))}
        </div>
      )}

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="relative z-10">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={fillBottom} />
            <stop offset="60%" stopColor={fillMid} />
            <stop offset="100%" stopColor={fillTop} />
          </linearGradient>
          <pattern id={`${uid}-scan`} patternUnits="userSpaceOnUse" width="100" height="3">
            <rect width="100" height="1" fill="rgba(0,0,0,0.15)" />
          </pattern>
        </defs>

        {/* Outer frame */}
        <rect x={barX - 3} y={barY - 3} width={barW + 6} height={barH + 6} rx={5} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        <rect x={barX} y={barY} width={barW} height={barH} rx={3} fill="#0c1222" />

        {/* Tick marks */}
        {ticks.map(t => {
          const ty = barY + barH - (t / 100) * barH;
          return (
            <g key={t}>
              <line x1={barX - 2} y1={ty} x2={barX + 3} y2={ty} stroke="#475569" strokeWidth="1" />
              <line x1={barX + barW - 3} y1={ty} x2={barX + barW + 2} y2={ty} stroke="#475569" strokeWidth="1" />
            </g>
          );
        })}

        {/* Fill bar */}
        <motion.rect
          x={barX + 1} width={barW - 2} rx={2}
          fill={`url(#${uid}-fill)`}
          initial={{ height: 0, y: barY + barH }}
          animate={{ height: fillH, y: fillY }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Scanlines */}
        <rect x={barX + 1} y={fillY} width={barW - 2} height={fillH} rx={2} fill={`url(#${uid}-scan)`} />

        {/* Pulsing top edge — starts at T1, gets faster with intensity */}
        {hasParticles && (
          <motion.rect
            x={barX + 1} y={fillY} width={barW - 2} height={3} rx={1}
            fill={isT3 ? '#fff176' : intensity > 0.5 ? '#ffaa00' : '#c4b5fd'}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2 - intensity * 0.8, repeat: Infinity }}
          />
        )}

        {/* Tier marker lines at 50%, 70%, 100% of bar */}
        {[50, 70, 100].map(dz => {
          const dy = barY + barH - (dz / 100) * barH;
          return (
            <line key={dz} x1={barX + 2} y1={dy} x2={barX + barW - 2} y2={dy}
              stroke={dz === 100 ? '#ff2d2d' : dz === 70 ? '#f97316' : '#8b5cf6'}
              strokeWidth="0.5" strokeDasharray="3 2" opacity={0.5} />
          );
        })}

        {/* Glass reflection */}
        <rect x={barX + 2} y={barY + 1} width={barW * 0.3} height={barH - 2} rx={2} fill="white" opacity={0.04} />
      </svg>

      {/* T3 MAX text */}
      {isT3 && (
        <motion.div
          className="absolute left-0 right-0 -bottom-1 text-center pointer-events-none z-20"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <span className="text-[8px] font-black tracking-widest text-red-500 drop-shadow-lg"
            style={{ textShadow: '0 0 8px rgba(255,45,45,0.8), 0 0 16px rgba(255,100,0,0.5)' }}>
            MAX!
          </span>
        </motion.div>
      )}
    </div>
  );
}