import React from 'react';
import { Calendar } from 'lucide-react';

const PRESETS = [
  { label: 'This Month', getRange: () => {
    const now = new Date();
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }},
  { label: 'Last Month', getRange: () => {
    const now = new Date();
    return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) };
  }},
  { label: 'Last 30 Days', getRange: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start, end: now };
  }},
  { label: 'Last 90 Days', getRange: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 90);
    return { start, end: now };
  }},
  { label: 'This Year', getRange: () => {
    const now = new Date();
    return { start: new Date(now.getFullYear(), 0, 1), end: now };
  }},
];

const fmt = (d) => d.toISOString().split('T')[0];

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const handlePreset = (preset) => {
    const { start, end } = preset.getRange();
    onStartChange(fmt(start));
    onEndChange(fmt(end));
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-slate-800/50 rounded-lg shadow px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-700/50">
        <Calendar className="w-4 h-4 text-slate-500 hidden sm:block" />
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium text-slate-300 min-w-[36px]">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="flex-1 px-2 sm:px-3 py-1.5 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] text-sm bg-slate-900 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium text-slate-300 min-w-[36px]">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="flex-1 px-2 sm:px-3 py-1.5 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] text-sm bg-slate-900 text-white"
          />
        </div>
      </div>
    </div>
  );
}