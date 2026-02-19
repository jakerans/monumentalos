import React, { useState, useRef, useEffect } from 'react';

export default function RevenueTooltip({ revenue, setRevenue, showRevenue, children }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setVisible(true), 800);
  };
  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {visible && revenue > 0 && (
        <div className="absolute z-50 bottom-full right-0 mb-2 w-44 bg-slate-900 border border-slate-600 rounded-lg shadow-xl p-3 text-xs space-y-1.5 pointer-events-none">
          <div className="flex justify-between">
            <span className="text-slate-400">Set Revenue</span>
            <span className="font-bold text-blue-400">${setRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Show Revenue</span>
            <span className="font-bold text-green-400">${showRevenue.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-700 pt-1.5 flex justify-between">
            <span className="text-slate-300 font-medium">Total</span>
            <span className="font-bold text-emerald-400">${revenue.toLocaleString()}</span>
          </div>
          <div className="absolute bottom-0 right-4 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600" />
        </div>
      )}
    </div>
  );
}