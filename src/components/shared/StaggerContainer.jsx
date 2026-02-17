import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { 
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  },
};

export function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}