import React from 'react';
import { motion } from 'framer-motion';

// intensity: 1=T1 white subtle, 2=T2 warning, 3=approaching max, 4=full inferno
function FlameParticle({ side, index, total, intensity }) {
  const pos = ((index + 0.5) / total) * 100;
  const baseSize = intensity >= 4 ? 8 : intensity >= 3 ? 6 : intensity >= 2 ? 5 : 4;
  const size = baseSize + Math.random() * (intensity >= 4 ? 10 : intensity >= 3 ? 6 : 4);

  const colorSets = {
    1: ['#ffffff', '#e2e8f0', '#cbd5e1', '#f8fafc'],
    2: ['#ff6b35', '#ffaa00', '#fbbf24', '#f59e0b'],
    3: ['#ff4500', '#ff6b35', '#ffaa00', '#ff2d2d'],
    4: ['#ff4500', '#ff2d2d', '#ff6b35', '#ffaa00', '#fff176'],
  };
  const colors = colorSets[intensity] || colorSets[4];
  const color = colors[index % colors.length];
  const delay = index * 0.08 + Math.random() * 0.3;
  const baseDuration = intensity >= 4 ? 0.5 : intensity >= 3 ? 0.7 : intensity >= 2 ? 0.9 : 1.1;
  const duration = baseDuration + Math.random() * 0.4;
  const reach = intensity >= 4 ? 18 : intensity >= 3 ? 14 : intensity >= 2 ? 10 : 7;

  const style = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}, transparent)`,
    filter: `blur(${intensity >= 3 ? 1.5 : 2}px)`,
    pointerEvents: 'none',
  };

  let posStyle = {};
  let animateProps = {};

  if (side === 'top') {
    posStyle = { left: `${pos}%`, top: -2 };
    animateProps = { y: [0, -reach - Math.random() * reach * 0.6], x: [(Math.random() - 0.5) * 10], opacity: [0, intensity >= 3 ? 1 : 0.7, 0], scale: [0.4, 1.3, 0] };
  } else if (side === 'bottom') {
    posStyle = { left: `${pos}%`, bottom: -2 };
    animateProps = { y: [0, reach + Math.random() * reach * 0.6], x: [(Math.random() - 0.5) * 10], opacity: [0, intensity >= 3 ? 1 : 0.7, 0], scale: [0.4, 1.3, 0] };
  } else if (side === 'left') {
    posStyle = { top: `${pos}%`, left: -2 };
    animateProps = { x: [0, -reach - Math.random() * reach * 0.6], y: [(Math.random() - 0.5) * 10], opacity: [0, intensity >= 3 ? 1 : 0.7, 0], scale: [0.4, 1.3, 0] };
  } else {
    posStyle = { top: `${pos}%`, right: -2 };
    animateProps = { x: [0, reach + Math.random() * reach * 0.6], y: [(Math.random() - 0.5) * 10], opacity: [0, intensity >= 3 ? 1 : 0.7, 0], scale: [0.4, 1.3, 0] };
  }

  return (
    <motion.div
      style={{ ...style, ...posStyle }}
      animate={animateProps}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

function EmberParticle({ index, intensity }) {
  const side = ['top', 'bottom', 'left', 'right'][index % 4];
  const pos = 10 + Math.random() * 80;
  const delay = index * 0.12 + Math.random() * 0.4;
  const reach = intensity >= 4 ? 50 : intensity >= 3 ? 35 : 20;
  const emberColor = intensity <= 1 ? '#e2e8f0' : '#ffaa00';
  const glowColor = intensity <= 1 ? '#94a3b8' : '#ff6b35';

  const posStyle = side === 'top' ? { left: `${pos}%`, top: 0 }
    : side === 'bottom' ? { left: `${pos}%`, bottom: 0 }
    : side === 'left' ? { top: `${pos}%`, left: 0 }
    : { top: `${pos}%`, right: 0 };

  const drift = (Math.random() - 0.5) * 40;
  const rise = -reach - Math.random() * reach * 0.5;
  const animateProps = side === 'top' || side === 'bottom'
    ? { y: [0, rise], x: [0, drift], opacity: [0, 1, 0], scale: [0.5, 0.8, 0] }
    : { x: [0, rise], y: [0, drift], opacity: [0, 1, 0], scale: [0.5, 0.8, 0] };

  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{
        ...posStyle,
        backgroundColor: emberColor,
        boxShadow: `0 0 4px ${glowColor}, 0 0 8px ${glowColor}66`,
      }}
      animate={animateProps}
      transition={{ duration: 1.5 + Math.random() * 0.8, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export default function WidgetFireBorder({ children, active, intensity = 4 }) {
  if (!active || intensity < 1) return children;

  // Scale everything by intensity
  const flamesPerSide = intensity >= 4 ? 14 : intensity >= 3 ? 10 : intensity >= 2 ? 6 : 3;
  const emberCount = intensity >= 4 ? 16 : intensity >= 3 ? 10 : intensity >= 2 ? 5 : 2;

  const glowConfigs = {
    1: {
      glow: [
        '0 0 6px rgba(226,232,240,0.15), 0 0 12px rgba(148,163,184,0.08)',
        '0 0 10px rgba(226,232,240,0.25), 0 0 20px rgba(148,163,184,0.12)',
        '0 0 6px rgba(226,232,240,0.15), 0 0 12px rgba(148,163,184,0.08)',
      ],
      borderColors: '#94a3b8, #cbd5e1, #e2e8f0, #f8fafc, #94a3b8',
      duration: 2.5,
    },
    2: {
      glow: [
        '0 0 10px rgba(255,107,53,0.25), 0 0 20px rgba(245,158,11,0.12)',
        '0 0 18px rgba(255,107,53,0.4), 0 0 35px rgba(245,158,11,0.2)',
        '0 0 10px rgba(255,107,53,0.25), 0 0 20px rgba(245,158,11,0.12)',
      ],
      borderColors: '#f59e0b, #ff6b35, #fbbf24, #ff6b35, #f59e0b',
      duration: 1.8,
    },
    3: {
      glow: [
        '0 0 18px rgba(255,69,0,0.4), 0 0 35px rgba(255,107,53,0.25), inset 0 0 12px rgba(255,69,0,0.08)',
        '0 0 30px rgba(255,69,0,0.6), 0 0 55px rgba(255,107,53,0.35), inset 0 0 18px rgba(255,69,0,0.12)',
        '0 0 18px rgba(255,69,0,0.4), 0 0 35px rgba(255,107,53,0.25), inset 0 0 12px rgba(255,69,0,0.08)',
      ],
      borderColors: '#ff4500, #ff6b35, #ffaa00, #ff2d2d, #ff4500',
      duration: 1.4,
    },
    4: {
      glow: [
        '0 0 25px rgba(255,45,45,0.5), 0 0 50px rgba(255,107,53,0.3), inset 0 0 20px rgba(255,69,0,0.15)',
        '0 0 45px rgba(255,45,45,0.8), 0 0 80px rgba(255,107,53,0.5), inset 0 0 30px rgba(255,69,0,0.2)',
        '0 0 25px rgba(255,45,45,0.5), 0 0 50px rgba(255,107,53,0.3), inset 0 0 20px rgba(255,69,0,0.15)',
      ],
      borderColors: '#ff2d2d, #ff4500, #ff6b35, #ffaa00, #ff2d2d',
      duration: 0.8,
    },
  };

  const config = glowConfigs[intensity] || glowConfigs[4];

  return (
    <div className="relative">
      {/* Pulsing glow behind the widget */}
      <motion.div
        className="absolute -inset-1 rounded-xl pointer-events-none z-0"
        animate={{ boxShadow: config.glow }}
        transition={{ duration: config.duration, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated fire border gradient */}
      <motion.div
        className="absolute -inset-[2px] rounded-xl pointer-events-none z-0"
        style={{
          background: `linear-gradient(45deg, ${config.borderColors})`,
          backgroundSize: '300% 300%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: config.duration, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner mask to create border effect */}
      <div className="absolute inset-[1.5px] rounded-[10px] bg-slate-800/95 pointer-events-none z-[1]" />

      {/* Flame particles around all 4 edges */}
      <div className="absolute -inset-3 pointer-events-none z-20 overflow-visible">
        {['top', 'bottom', 'left', 'right'].map(side =>
          Array.from({ length: flamesPerSide }).map((_, i) => (
            <FlameParticle key={`${side}-${i}`} side={side} index={i} total={flamesPerSide} intensity={intensity} />
          ))
        )}
        {Array.from({ length: emberCount }).map((_, i) => (
          <EmberParticle key={`ember-${i}`} index={i} intensity={intensity} />
        ))}
      </div>

      {/* Actual content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}