import React, { useId } from 'react';
import { motion } from 'framer-motion';

// tierIdx: -1=none, 0=T1, 1=T2, 2=T3
// T1 = subtle white flames on bar
// T2 = bright orange flames on bar, growing intensity toward T3
// T3 = bar is fully lit (handled externally by WidgetFireBorder for the whole widget)

function WhiteFlameParticle({ x, delay, size }) {
  const colors = ['#ffffff', '#f1f5f9', '#e2e8f0', '#f8fafc'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`, bottom: 0, width: size, height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        filter: 'blur(1.5px)',
      }}
      animate={{
        y: [0, -10 - Math.random() * 8],
        x: [0, (Math.random() - 0.5) * 8],
        opacity: [0, 0.5, 0],
        scale: [0.3, 0.9, 0],
      }}
      transition={{ duration: 1.2 + Math.random() * 0.5, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

function OrangeFlameParticle({ x, delay, size, intensityFactor }) {
  // intensityFactor 0..1 controls how big/bright the flames get within T2
  const colors = intensityFactor > 0.7
    ? ['#ff4500', '#ff6b35', '#ffaa00', '#fff176']
    : ['#ff6b35', '#ffaa00', '#ffd54f'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const reach = 14 + intensityFactor * 18;
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`, bottom: 0, width: size, height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -reach - Math.random() * reach * 0.5],
        x: [0, (Math.random() - 0.5) * 14],
        opacity: [0, 0.7 + intensityFactor * 0.3, 0],
        scale: [0.3, 1.1 + intensityFactor * 0.3, 0],
      }}
      transition={{ duration: 0.7 + Math.random() * 0.5 - intensityFactor * 0.2, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export default function ArcadeOverheatMeter({ fillPct, topped, tierIdx = -1 }) {
  const uid = useId();
  const clampedPct = Math.max(2, Math.min(fillPct, 100));

  const isT1 = tierIdx === 0;
  const isT2 = tierIdx === 1;
  const isT3 = tierIdx >= 2 || topped;

  // For T2, compute how far through T2 we are (0 to 1) for flame intensity scaling
  // T2 starts at ~70% of max, T3 at 100%. So we map 70-100 pct to 0-1
  const t2IntensityFactor = isT2 ? Math.min(1, Math.max(0, (clampedPct - 70) / 30)) : 0;

  const w = 72;
  const h = 80;
  const barX = 10;
  const barW = w - 20;
  const barY = 6;
  const barH = h - 12;
  const fillH = (clampedPct / 100) * barH;
  const fillY = barY + barH - fillH;
  const ticks = [0, 25, 50, 75, 100];

  // Flame counts based on tier
  const whiteFlameCount = isT1 ? 4 : 0;
  const orangeFlameCount = isT2 ? Math.round(3 + t2IntensityFactor * 8) : isT3 ? 12 : 0;

  // Bar fill colors by tier
  const fillBottom = isT3 ? '#ff2d2d' : isT2 ? '#f97316' : isT1 ? '#94a3b8' : '#0ea5e9';
  const fillMid = isT3 ? '#ff6b35' : isT2 ? '#ffaa00' : isT1 ? '#cbd5e1' : '#38bdf8';
  const fillTop = isT3 ? '#ffaa00' : isT2 ? '#fcd34d' : isT1 ? '#f1f5f9' : '#7dd3fc';

  const glowColor = isT3 ? 'rgba(255,45,45,0.6)' : isT2 ? 'rgba(249,115,22,0.4)' : isT1 ? 'rgba(148,163,184,0.3)' : 'rgba(14,165,233,0.3)';

  return (
    <div className="relative" style={{ width: w, height: h + (isT3 ? 16 : isT2 ? 8 : isT1 ? 4 : 0) }}>
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-xl pointer-events-none"
        style={{ inset: -4 }}
        animate={isT3 ? {
          boxShadow: [`0 0 25px ${glowColor}`, `0 0 40px rgba(255,45,45,0.7)`, `0 0 25px ${glowColor}`],
        } : {
          boxShadow: [`0 0 8px ${glowColor}`, `0 0 14px ${glowColor}`, `0 0 8px ${glowColor}`],
        }}
        transition={{ duration: isT3 ? 0.4 : 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* White flame particles for T1 */}
      {isT1 && (
        <div className="absolute overflow-visible pointer-events-none"
          style={{ left: barX, width: barW, bottom: h - fillY, height: 20 }}>
          {Array.from({ length: whiteFlameCount }).map((_, i) => (
            <WhiteFlameParticle key={`wf${i}`} x={15 + (i / whiteFlameCount) * 70} delay={i * 0.25} size={4 + Math.random() * 3} />
          ))}
        </div>
      )}

      {/* Orange flame particles for T2 (grow in intensity toward T3) */}
      {(isT2 || isT3) && (
        <div className="absolute overflow-visible pointer-events-none"
          style={{ left: barX, width: barW, bottom: h - fillY + (isT3 ? 8 : 0), height: 30 }}>
          {Array.from({ length: orangeFlameCount }).map((_, i) => (
            <OrangeFlameParticle
              key={`of${i}`}
              x={8 + (i / orangeFlameCount) * 84}
              delay={i * 0.1}
              size={isT3 ? 7 + Math.random() * 6 : 4 + t2IntensityFactor * 4 + Math.random() * 3}
              intensityFactor={isT3 ? 1 : t2IntensityFactor}
            />
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

        {/* Pulsing top edge for T2+ */}
        {(isT2 || isT3) && (
          <motion.rect
            x={barX + 1} y={fillY} width={barW - 2} height={3} rx={1}
            fill={isT3 ? '#fff176' : '#ffaa00'}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: isT3 ? 0.2 : 0.6 - t2IntensityFactor * 0.3, repeat: Infinity }}
          />
        )}

        {/* Tier marker lines at 50%, 70%, 100% of bar */}
        {[50, 70, 100].map(dz => {
          const dy = barY + barH - (dz / 100) * barH;
          return (
            <line key={dz} x1={barX + 2} y1={dy} x2={barX + barW - 2} y2={dy}
              stroke={dz === 100 ? '#ff2d2d' : dz === 70 ? '#f97316' : '#94a3b8'}
              strokeWidth="0.5" strokeDasharray="3 2" opacity={0.5} />
          );
        })}

        {/* Glass reflection */}
        <rect x={barX + 2} y={barY + 1} width={barW * 0.3} height={barH - 2} rx={2} fill="white" opacity={0.04} />
      </svg>

      {/* T3 OVERHEAT text */}
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