import React, { useState, useRef, useEffect } from 'react';
import { History } from 'lucide-react';

export default function PerfLastMonthTooltip({ records }) {
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setShow(true), 2000);
  };
  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setShow(false);
  };
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!records || records.length === 0) return null;

  // Determine period label from first record
  const period = records[0]?.period || 'Last Month';
  const periodLabel = (() => {
    const parts = period.split('-');
    if (parts.length === 2) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(parts[1], 10) - 1] || parts[1]} ${parts[0]}`;
    }
    return period;
  })();

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <History className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
      {show && (
        <div className="absolute z-50 bottom-full right-0 mb-2 px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 shadow-2xl min-w-[220px] max-w-[300px] animate-in fade-in-0 zoom-in-95 duration-150">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{periodLabel} Summary</p>
          <div className="space-y-2">
            {records.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-200 font-medium">{r.tier_reached || 'N/A'}</p>
                  <p className="text-[10px] text-slate-500">${(r.metric_value || 0).toLocaleString()} revenue</p>
                </div>
                <p className={`text-sm font-bold ${(r.payout || 0) > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  ${(r.payout || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-600" />
        </div>
      )}
    </span>
  );
}