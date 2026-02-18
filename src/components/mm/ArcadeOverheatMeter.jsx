import React, { useId } from 'react';
import { motion } from 'framer-motion';

const HEAT_STOPS = [
  { pct: 0,   fill: '#1e3a5f', glow: 'rgba(30,58,95,0.3)', label: 'Cold' },
  { pct: 25,  fill: '#0ea5e9', glow: 'rgba(14,165,233,0.4)', label: 'Warm' },
  { pct: 50,  fill: '#f59e0b', glow: 'rgba(245,158,11,0.5)', label: 'Hot' },
  { pct: 70,  fill: '#f97316', glow: 'rgba(249,115,22,0.5)', label: 'WARNING' },
  { pct: 85,  fill: '#ef4444', glow: 'rgba(239,68,68,0.5)', label: 'Critical' },
  { pct: 95,  fill: '#ff2d2d', glow: 'rgba(255,45,45,0.6)', label: 'OVERHEAT' },
];

function getHeatColor(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  for (let i = HEAT_STOPS.length - 1; i >= 0; i--) {
    if (clamped >= HEAT_STOPS[i].pct) return HEAT_STOPS[i];
  }
  return HEAT_STOPS[0];
}

function WhiteFlameParticle({ x, delay, size }) {
  const colors = ['#ffffff', '#f1f5f9', '#e2e8f0', '#f8fafc'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: 0,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        filter: 'blur(1.5px)',
      }}
      animate={{
        y: [0, -12 - Math.random() * 10],
        x: [0, (Math.random() - 0.5) * 10],
        opacity: [0, 0.6, 0],
        scale: [0.3, 1, 0],
      }}
      transition={{
        duration: 1 + Math.random() * 0.5,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

function FlameParticle({ x, delay, size, heatPct }) {
  const colors = heatPct > 85 ? ['#ff4500', '#ff6b35', '#ffaa00', '#fff176'] : ['#ff6b35', '#ffaa00', '#ffd54f'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: 0,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -20 - Math.random() * 25],
        x: [0, (Math.random() - 0.5) * 16],
        opacity: [0, 0.9, 0],
        scale: [0.3, 1.2, 0],
      }}
      transition={{
        duration: 0.8 + Math.random() * 0.6,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

function EmberParticle({ delay }) {
  const x = 10 + Math.random() * 80;
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: 0,
        backgroundColor: '#ffaa00',
        boxShadow: '0 0 4px #ff6b35',
      }}
      animate={{
        y: [0, -50 - Math.random() * 40],
        x: [0, (Math.random() - 0.5) * 30],
        opacity: [0, 1, 0],
        scale: [0.5, 0.8, 0],
      }}
      transition={{
        duration: 1.2 + Math.random() * 0.8,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export default function ArcadeOverheatMeter({ fillPct, topped }) {
  const uid = useId();
  const clampedPct = Math.max(2, Math.min(fillPct, 100));
  const heat = getHeatColor(clampedPct);
  const isOverheat = clampedPct >= 95 || topped;
  const isWarning = clampedPct >= 70;
  const isCritical = clampedPct >= 85;
  const isHot = clampedPct >= 50;
  const isT1 = clampedPct >= 25 && clampedPct < 50; // White flames zone

  const w = 72;
  const h = 80;
  const barX = 10;
  const barW = w - 20;
  const barY = 6;
  const barH = h - 12;
  const fillH = (clampedPct / 100) * barH;
  const fillY = barY + barH - fillH;

  const ticks = [0, 25, 50, 75, 100];

  const flameCount = isOverheat ? 10 : isCritical ? 7 : isWarning ? 5 : isHot ? 3 : 0;
  const emberCount = isOverheat ? 6 : isCritical ? 4 : isWarning ? 2 : 0;
  const whiteFlameCount = isT1 ? 4 : 0;

  return (
    <div className="relative" style={{ width: w, height: h + (isOverheat ? 20 : isHot ? 10 : isT1 ? 6 : 0) }}>
      {/* Ambient glow behind meter */}
      <motion.div
        className="absolute rounded-xl pointer-events-none"
        style={{
          inset: -4,
          boxShadow: `0 0 ${isOverheat ? 30 : isCritical ? 20 : isWarning ? 14 : 10}px ${heat.glow}`,
        }}
        animate={isOverheat ? {
          boxShadow: [
            `0 0 25px ${heat.glow}`,
            `0 0 40px rgba(255,45,45,0.7)`,
            `0 0 25px ${heat.glow}`,
          ],
        } : { opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: isOverheat ? 0.4 : 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* White flame particles for T1 */}
      {isT1 && (
        <div
          className="absolute overflow-visible pointer-events-none"
          style={{ left: barX, width: barW, bottom: h - fillY, height: 20 }}
        >
          {Array.from({ length: whiteFlameCount }).map((_, i) => (
            <WhiteFlameParticle
              key={`wf${i}`}
              x={15 + (i / whiteFlameCount) * 70}
              delay={i * 0.2}
              size={4 + Math.random() * 3}
            />
          ))}
        </div>
      )}

      {/* Fire flame particles at top of fill */}
      {isHot && (
        <div
          className="absolute overflow-visible pointer-events-none"
          style={{ left: barX, width: barW, bottom: h - fillY + (isOverheat ? 10 : 0), height: 30 }}
        >
          {Array.from({ length: flameCount }).map((_, i) => (
            <FlameParticle
              key={`f${i}`}
              x={10 + (i / flameCount) * 80}
              delay={i * 0.12}
              size={isOverheat ? 8 + Math.random() * 6 : isCritical ? 6 + Math.random() * 5 : 5 + Math.random() * 4}
              heatPct={clampedPct}
            />
          ))}
          {Array.from({ length: emberCount }).map((_, i) => (
            <EmberParticle key={`e${i}`} delay={0.3 + i * 0.2} />
          ))}
        </div>
      )}

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="relative z-10">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={isOverheat ? '#ff2d2d' : isCritical ? '#ef4444' : isWarning ? '#f97316' : isHot ? '#f59e0b' : isT1 ? '#94a3b8' : '#0ea5e9'} />
            <stop offset="60%" stopColor={isOverheat ? '#ff6b35' : isCritical ? '#ff6b35' : isWarning ? '#ffaa00' : isHot ? '#ffaa00' : isT1 ? '#cbd5e1' : '#38bdf8'} />
            <stop offset="100%" stopColor={isOverheat ? '#ffaa00' : isCritical ? '#fbbf24' : isWarning ? '#fcd34d' : isHot ? '#fcd34d' : isT1 ? '#f1f5f9' : '#7dd3fc'} />
          </linearGradient>
          <pattern id={`${uid}-scan`} patternUnits="userSpaceOnUse" width="100" height="3">
            <rect width="100" height="1" fill="rgba(0,0,0,0.15)" />
          </pattern>
          <filter id={`${uid}-glow`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
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
          x={barX + 1}
          width={barW - 2}
          rx={2}
          fill={`url(#${uid}-fill)`}
          initial={{ height: 0, y: barY + barH }}
          animate={{ height: fillH, y: fillY }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Scanlines overlay */}
        <rect x={barX + 1} y={fillY} width={barW - 2} height={fillH} rx={2} fill={`url(#${uid}-scan)`} />

        {/* Pulsing top edge */}
        {(isWarning || isCritical || isOverheat) && (
          <motion.rect
            x={barX + 1}
            y={fillY}
            width={barW - 2}
            height={3}
            rx={1}
            fill={isOverheat ? '#fff176' : isCritical ? '#fbbf24' : '#ffaa00'}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: isOverheat ? 0.2 : isWarning ? 0.5 : 0.6, repeat: Infinity }}
          />
        )}

        {/* Danger zone markers */}
        {[70, 85, 95].map(dz => {
          const dy = barY + barH - (dz / 100) * barH;
          return (
            <line key={dz} x1={barX + 2} y1={dy} x2={barX + barW - 2} y2={dy}
              stroke={dz === 95 ? '#ff2d2d' : dz === 85 ? '#ef4444' : '#f97316'}
              strokeWidth="0.5" strokeDasharray="3 2" opacity={0.6} />
          );
        })}

        {/* Glass reflection */}
        <rect x={barX + 2} y={barY + 1} width={barW * 0.3} height={barH - 2} rx={2} fill="white" opacity={0.04} />
      </svg>

      {/* WARNING text at T2 */}
      {isWarning && !isOverheat && (
        <motion.div
          className="absolute left-0 right-0 -bottom-1 text-center pointer-events-none z-20"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <span className="text-[7px] font-black tracking-widest text-amber-400 drop-shadow-lg"
            style={{ textShadow: '0 0 6px rgba(245,158,11,0.6)' }}>
            WARNING!
          </span>
        </motion.div>
      )}

      {/* OVERHEAT text flashing */}
      {isOverheat && (
        <motion.div
          className="absolute left-0 right-0 -bottom-1 text-center pointer-events-none z-20"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <span className="text-[8px] font-black tracking-widest text-red-500 drop-shadow-lg"
            style={{ textShadow: '0 0 8px rgba(255,45,45,0.8), 0 0 16px rgba(255,100,0,0.5)' }}>
            OVERHEAT!
          </span>
        </motion.div>
      )}
    </div>
  );
}