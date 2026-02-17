import React from 'react';
import { motion } from 'framer-motion';

export default function GlowCard({ children, className = '', glowColor = 'rgba(214,255,3,0.08)' }) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.015, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div 
        className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
        style={{ background: glowColor }}
      />
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}