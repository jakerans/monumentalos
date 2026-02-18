import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import STLStatusWidget from '../setter/STLStatusWidget';

const PRESETS = [
  { label: '< 1 min', value: 0.5 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

export default function STLPreviewTester() {
  const [minutes, setMinutes] = useState(5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-3.5 h-3.5 text-amber-400" />
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Speed-to-Lead Widget Tester</p>
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => setMinutes(p.value)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              minutes === p.value
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
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
          max={90}
          step={0.5}
          value={minutes}
          onChange={e => setMinutes(Number(e.target.value))}
          className="flex-1 accent-amber-500 h-1.5"
        />
        <span className="text-xs font-bold text-slate-300 w-14 text-right">{minutes}m</span>
      </div>

      {/* Preview widget */}
      <div className="max-w-[200px]">
        <STLStatusWidget avgSTL={minutes} teamAvgSTL={3.5} />
      </div>
    </div>
  );
}