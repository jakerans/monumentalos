import React from 'react';
import { motion } from 'framer-motion';

function FlameParticle({ side, index, total }) {
  // Position along the edge
  const pos = ((index + 0.5) / total) * 100;
  const size = 6 + Math.random() * 8;
  const colors = ['#ff4500', '#ff6b35', '#ffaa00', '#fff176', '#ff2d2d'];
  const color = colors[index % colors.length];
  const delay = index * 0.08 + Math.random() * 0.3;
  const duration = 0.6 + Math.random() * 0.5;

  const style = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}, transparent)`,
    filter: 'blur(1.5px)',
    pointerEvents: 'none',
  };

  let posStyle = {};
  let animateProps = {};

  if (side === 'top') {
    posStyle = { left: `${pos}%`, top: -2 };
    animateProps = { y: [0, -14 - Math.random() * 10], x: [(Math.random() - 0.5) * 8], opacity: [0, 0.9, 0], scale: [0.4, 1.2, 0] };
  } else if (side === 'bottom') {
    posStyle = { left: `${pos}%`, bottom: -2 };
    animateProps = { y: [0, 14 + Math.random() * 10], x: [(Math.random() - 0.5) * 8], opacity: [0, 0.9, 0], scale: [0.4, 1.2, 0] };
  } else if (side === 'left') {
    posStyle = { top: `${pos}%`, left: -2 };
    animateProps = { x: [0, -14 - Math.random() * 10], y: [(Math.random() - 0.5) * 8], opacity: [0, 0.9, 0], scale: [0.4, 1.2, 0] };
  } else {
    posStyle = { top: `${pos}%`, right: -2 };
    animateProps = { x: [0, 14 + Math.random() * 10], y: [(Math.random() - 0.5) * 8], opacity: [0, 0.9, 0], scale: [0.4, 1.2, 0] };
  }

  return (
    <motion.div
      style={{ ...style, ...posStyle }}
      animate={animateProps}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

function EmberParticle({ index }) {
  const side = ['top', 'bottom', 'left', 'right'][index % 4];
  const pos = 10 + Math.random() * 80;
  const delay = index * 0.15 + Math.random() * 0.5;

  const posStyle = side === 'top' ? { left: `${pos}%`, top: 0 }
    : side === 'bottom' ? { left: `${pos}%`, bottom: 0 }
    : side === 'left' ? { top: `${pos}%`, left: 0 }
    : { top: `${pos}%`, right: 0 };

  const drift = (Math.random() - 0.5) * 40;
  const rise = -30 - Math.random() * 30;
  const animateProps = side === 'top' || side === 'bottom'
    ? { y: [0, rise], x: [0, drift], opacity: [0, 1, 0], scale: [0.5, 0.8, 0] }
    : { x: [0, rise], y: [0, drift], opacity: [0, 1, 0], scale: [0.5, 0.8, 0] };

  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{
        ...posStyle,
        backgroundColor: '#ffaa00',
        boxShadow: '0 0 4px #ff6b35, 0 0 8px #ff450066',
      }}
      animate={animateProps}
      transition={{ duration: 1.5 + Math.random() * 0.8, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export default function WidgetFireBorder({ children, active }) {
  if (!active) return children;

  const flamesPerSide = 8;

  return (
    <div className="relative">
      {/* Pulsing fire glow behind the widget */}
      <motion.div
        className="absolute -inset-1 rounded-xl pointer-events-none z-0"
        animate={{
          boxShadow: [
            '0 0 15px rgba(255,69,0,0.4), 0 0 30px rgba(255,107,53,0.2), inset 0 0 15px rgba(255,69,0,0.1)',
            '0 0 25px rgba(255,69,0,0.6), 0 0 50px rgba(255,107,53,0.35), inset 0 0 20px rgba(255,69,0,0.15)',
            '0 0 15px rgba(255,69,0,0.4), 0 0 30px rgba(255,107,53,0.2), inset 0 0 15px rgba(255,69,0,0.1)',
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated fire border gradient */}
      <motion.div
        className="absolute -inset-[2px] rounded-xl pointer-events-none z-0"
        style={{
          background: 'linear-gradient(45deg, #ff4500, #ff6b35, #ffaa00, #ff2d2d, #ff4500)',
          backgroundSize: '300% 300%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner mask to create border effect */}
      <div className="absolute inset-[1.5px] rounded-[10px] bg-slate-800/95 pointer-events-none z-[1]" />

      {/* Flame particles around all 4 edges */}
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        {['top', 'bottom', 'left', 'right'].map(side =>
          Array.from({ length: flamesPerSide }).map((_, i) => (
            <FlameParticle key={`${side}-${i}`} side={side} index={i} total={flamesPerSide} />
          ))
        )}
        {Array.from({ length: 10 }).map((_, i) => (
          <EmberParticle key={`ember-${i}`} index={i} />
        ))}
      </div>

      {/* Actual content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}