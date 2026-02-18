import React, { useId } from 'react';
import { motion } from 'framer-motion';

// Color stops for tiers: slate → purple → blue → emerald → lime/gold
const TIER_COLORS = [
  { fill: '#475569', glow: 'rgba(71,85,105,0.3)', wave: '#64748b' },   // no tier
  { fill: '#7c3aed', glow: 'rgba(124,58,237,0.4)', wave: '#a78bfa' },  // tier 1
  { fill: '#3b82f6', glow: 'rgba(59,130,246,0.4)', wave: '#60a5fa' },  // tier 2
  { fill: '#10b981', glow: 'rgba(16,185,129,0.4)', wave: '#34d399' },  // tier 3
  { fill: '#D6FF03', glow: 'rgba(214,255,3,0.4)', wave: '#e2ff55' },   // topped / tier 4+
];

function getColorForTier(tierIdx, topped) {
  if (topped) return TIER_COLORS[4];
  if (tierIdx < 0) return TIER_COLORS[0];
  return TIER_COLORS[Math.min(tierIdx + 1, TIER_COLORS.length - 1)];
}

// Blend between current tier color and next tier color based on how close to next threshold
function blendColors(c1, c2, t) {
  const parse = (hex) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return [r, g, b];
  };
  const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export default function LiquidGauge({ fillPct, tierIdx, topped, nextTierPct }) {
  const uid = useId();
  const clampedPct = Math.max(5, Math.min(fillPct, 100));
  const currentColors = getColorForTier(tierIdx, topped);
  const nextColors = getColorForTier(tierIdx + 1, topped);
  
  // Blend toward next tier color as we approach the threshold
  const blendT = topped ? 1 : (nextTierPct || 0);
  const liquidFill = blendColors(currentColors.fill, nextColors.fill, blendT);
  const liquidWave = blendColors(currentColors.wave, nextColors.wave, blendT);
  const liquidGlow = currentColors.glow;

  // SVG dimensions
  const w = 72;
  const h = 80;
  const rx = 12;
  // Water level from bottom
  const waterY = h - (clampedPct / 100) * (h - 8);

  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* Glow backdrop */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ boxShadow: `0 0 18px ${liquidGlow}, inset 0 0 8px ${liquidGlow}` }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="relative z-10">
        <defs>
          {/* Container clip */}
          <clipPath id={`${uid}-clip`}>
            <rect x="2" y="2" width={w - 4} height={h - 4} rx={rx} />
          </clipPath>
          {/* Liquid gradient */}
          <linearGradient id={`${uid}-grad`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={liquidWave} stopOpacity="0.9" />
            <stop offset="100%" stopColor={liquidFill} stopOpacity="1" />
          </linearGradient>
          {/* Surface shimmer */}
          <linearGradient id={`${uid}-shimmer`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Container outline */}
        <rect x="2" y="2" width={w - 4} height={h - 4} rx={rx} fill="none" stroke="#334155" strokeWidth="1.5" />
        <rect x="2" y="2" width={w - 4} height={h - 4} rx={rx} fill="#0f172a" opacity="0.6" />

        {/* Clipped liquid area */}
        <g clipPath={`url(#${uid}-clip)`}>
          {/* Back wave (slower, slightly different phase) */}
          <motion.path
            d={makeWavePath(w, h, waterY, 0)}
            fill={liquidFill}
            opacity={0.5}
            animate={{
              d: [
                makeWavePath(w, h, waterY, 0),
                makeWavePath(w, h, waterY, Math.PI),
                makeWavePath(w, h, waterY, Math.PI * 2),
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Front wave */}
          <motion.path
            d={makeWavePath(w, h, waterY, Math.PI * 0.5)}
            fill={`url(#${uid}-grad)`}
            animate={{
              d: [
                makeWavePath(w, h, waterY, Math.PI * 0.5),
                makeWavePath(w, h, waterY, Math.PI * 1.5),
                makeWavePath(w, h, waterY, Math.PI * 2.5),
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Surface shimmer band */}
          <motion.rect
            x="0"
            y={waterY - 3}
            width={w}
            height="6"
            fill={`url(#${uid}-shimmer)`}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Bubble particles */}
          {[0.2, 0.5, 0.75].map((xRatio, i) => (
            <motion.circle
              key={i}
              cx={w * xRatio}
              r={1.5 + i * 0.5}
              fill="white"
              opacity={0.2}
              animate={{
                cy: [h, waterY - 4],
                opacity: [0, 0.25, 0],
              }}
              transition={{
                duration: 2.5 + i * 0.7,
                repeat: Infinity,
                delay: i * 1.2,
                ease: 'easeOut',
              }}
            />
          ))}
        </g>

        {/* Tick marks on the side for tiers — small lines */}
      </svg>
    </div>
  );
}

function makeWavePath(w, h, waterY, phase) {
  const amp = 3;
  const freq = 2;
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = waterY + Math.sin((i / steps) * Math.PI * freq + phase) * amp;
    points.push(`${x},${y}`);
  }
  return `M0,${h} L${points.join(' L')} L${w},${h} Z`;
}