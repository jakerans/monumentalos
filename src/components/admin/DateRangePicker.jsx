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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 bg-white rounded-lg shadow px-4 py-2.5 border border-gray-200">
        <Calendar className="w-4 h-4 text-gray-500" />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
}