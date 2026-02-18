import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders } from 'lucide-react';
import SpiffCard from '../setter/SpiffCard';

const DEMO_SPIFF = {
  id: 'demo',
  title: 'Monthly Booking Bonus',
  description: 'Hit your target and earn a bonus!',
  qualifier: 'appointments',
  goal_value: 20,
  reward: '$200 Bonus',
  due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  status: 'active',
};

const PRESETS = [
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
];

export default function SpiffPreviewTester() {
  const [pctOverride, setPctOverride] = useState(50);

  const progress = Math.round((pctOverride / 100) * DEMO_SPIFF.goal_value);
  const pct = Math.min(pctOverride, 100);
  const met = pct >= 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-3.5 h-3.5 text-purple-400" />
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Spiff Widget Tester</p>
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-2">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => setPctOverride(p.value)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              pctOverride === p.value
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={pctOverride}
          onChange={e => setPctOverride(Number(e.target.value))}
          className="flex-1 accent-purple-500 h-1.5"
        />
        <span className="text-xs font-bold text-slate-300 w-10 text-right">{pctOverride}%</span>
      </div>

      {/* Preview card */}
      <div className="max-w-sm">
        <SpiffCard
          spiff={DEMO_SPIFF}
          progress={progress}
          pct={pct}
          met={met}
          isSTL={false}
        />
      </div>
    </div>
  );
}