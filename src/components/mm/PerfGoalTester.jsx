import React from 'react';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const REVENUE_PRESETS = [
  { label: '$30k', value: 30000 },
  { label: 'T1 ($50k)', value: 50000 },
  { label: '$60k', value: 60000 },
  { label: 'T2 ($70k)', value: 70000 },
  { label: '$85k', value: 85000 },
  { label: 'T3 🔥 ($100k)', value: 100000 },
  { label: 'Reset', value: null },
];

export default function PerfGoalTester({ onOverride }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 border border-dashed border-amber-500/30 rounded-lg p-3 mb-3"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Eye className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Preview Mode</span>
      </div>

      {/* Revenue presets */}
      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
      <div className="flex flex-wrap gap-1.5">
        {REVENUE_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => onOverride(p.value)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              p.value === null
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}