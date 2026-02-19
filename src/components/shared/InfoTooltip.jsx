import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';

export default function InfoTooltip({ text, iconClassName = "w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors", delay = 1200 }) {
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const positionTooltip = useCallback(() => {
    if (!triggerRef.current || !popRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pop = popRef.current;
    let left = rect.left + rect.width / 2 - pop.offsetWidth / 2;
    let top = rect.top - pop.offsetHeight - 8;
    // Keep within viewport
    if (left < 8) left = 8;
    if (left + pop.offsetWidth > window.innerWidth - 8) left = window.innerWidth - pop.offsetWidth - 8;
    if (top < 8) top = rect.bottom + 8;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }, []);

  useEffect(() => {
    if (show) requestAnimationFrame(positionTooltip);
  }, [show, positionTooltip]);

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
          ref={popRef}
          className="fixed z-[9999] px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 shadow-xl text-[11px] leading-relaxed text-slate-300 whitespace-normal min-w-[180px] max-w-[280px] animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ pointerEvents: 'none' }}
        >
          {text}
        </div>
      )}
    </span>
  );
}