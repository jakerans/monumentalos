import React, { useState, useRef, useEffect } from 'react';

export default function RevenueTooltip({ revenue, setRevenue, showRevenue, children }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setVisible(true), 300);
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
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-3 text-xs space-y-2 pointer-events-none">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Set Revenue</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-blue-400">${setRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">({revenue > 0 ? Math.round((setRevenue / revenue) * 100) : 0}%)</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Show Revenue</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-green-400">${showRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">({revenue > 0 ? Math.round((showRevenue / revenue) * 100) : 0}%)</span>
            </div>
          </div>
          {/* Mini bar */}
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden flex">
            {setRevenue > 0 && <div className="bg-blue-400 h-full" style={{ width: `${(setRevenue / revenue) * 100}%` }} />}
            {showRevenue > 0 && <div className="bg-green-400 h-full" style={{ width: `${(showRevenue / revenue) * 100}%` }} />}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600" />
        </div>
      )}
    </div>
  );
}