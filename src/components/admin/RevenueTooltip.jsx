import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function RevenueTooltip({ revenue, setRevenue, showRevenue, children }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const positionTooltip = useCallback(() => {
    if (!triggerRef.current || !popRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pop = popRef.current;
    pop.style.left = `${rect.left + rect.width / 2 - pop.offsetWidth / 2}px`;
    pop.style.top = `${rect.top - pop.offsetHeight - 8}px`;
  }, []);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(positionTooltip);
    }
  }, [visible, positionTooltip]);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setVisible(true), 300);
  };
  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const setPct = revenue > 0 ? Math.round((setRevenue / revenue) * 100) : 0;
  const showPct = revenue > 0 ? Math.round((showRevenue / revenue) * 100) : 0;

  return (
    <div className="relative inline-block" ref={triggerRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {visible && revenue > 0 && (
        <div className="fixed z-[9999]" style={{ pointerEvents: 'none' }} ref={popRef}>
          <div className="bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-2.5 text-xs w-36 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-blue-400 font-medium">Set</span>
              <span className="font-bold text-blue-400">${setRevenue.toLocaleString()} <span className="text-slate-500 font-normal text-[10px]">({setPct}%)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400 font-medium">Show</span>
              <span className="font-bold text-green-400">${showRevenue.toLocaleString()} <span className="text-slate-500 font-normal text-[10px]">({showPct}%)</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden flex">
              {setRevenue > 0 && <div className="bg-blue-400 h-full" style={{ width: `${setPct}%` }} />}
              {showRevenue > 0 && <div className="bg-green-400 h-full" style={{ width: `${showPct}%` }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}