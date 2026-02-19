import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function InfoTooltip({ text, iconClassName = "w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors", delay = 1200 }) {
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setShow(true), delay);
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setShow(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <span className="relative inline-flex items-center" onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={triggerRef}>
      <Info className={`${iconClassName} cursor-help`} />
      {show && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 shadow-xl text-[11px] leading-relaxed text-slate-300 whitespace-normal min-w-[180px] max-w-[280px] animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600" />
        </div>
      )}
    </span>
  );
}