import React, { useState, useRef, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const PRESETS = [
  { label: 'Today', getRange: () => [dayjs(), dayjs()] },
  { label: 'Yesterday', getRange: () => [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { label: 'Last 7 Days', getRange: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { label: 'Last 14 Days', getRange: () => [dayjs().subtract(13, 'day'), dayjs()] },
  { label: 'Last 30 Days', getRange: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { label: 'This Month', getRange: () => [dayjs().startOf('month'), dayjs()] },
  { label: 'Last Month', getRange: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  { label: 'Last 90 Days', getRange: () => [dayjs().subtract(89, 'day'), dayjs()] },
  { label: 'This Quarter', getRange: () => {
    const q = Math.floor(dayjs().month() / 3);
    return [dayjs().month(q * 3).startOf('month'), dayjs()];
  }},
  { label: 'This Year', getRange: () => [dayjs().startOf('year'), dayjs()] },
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarMonth({ month, start, end, hoverDate, onDateClick, onDateHover }) {
  const firstDay = month.startOf('month');
  const daysInMonth = month.daysInMonth();
  const startWeekday = firstDay.day();

  const days = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(month.date(i));
  }

  const isToday = (d) => d && d.isSame(dayjs(), 'day');
  const isStart = (d) => d && start && d.isSame(start, 'day');
  const isEnd = (d) => d && end && d.isSame(end, 'day');

  const isInRange = (d) => {
    if (!d || !start) return false;
    const rangeEnd = end || hoverDate;
    if (!rangeEnd) return false;
    const [lo, hi] = start.isBefore(rangeEnd) ? [start, rangeEnd] : [rangeEnd, start];
    return d.isAfter(lo, 'day') && d.isBefore(hi, 'day');
  };

  const isFuture = (d) => d && d.isAfter(dayjs(), 'day');

  return (
    <div className="w-full">
      <div className="text-center text-sm font-semibold text-white mb-2">
        {month.format('MMMM YYYY')}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-[10px] font-medium text-slate-500 py-1">{w}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const selected = isStart(d) || isEnd(d);
          const inRange = isInRange(d);
          const today = isToday(d);
          const future = isFuture(d);

          return (
            <button
              key={d.format('YYYY-MM-DD')}
              onClick={() => !future && onDateClick(d)}
              onMouseEnter={() => onDateHover(d)}
              disabled={future}
              className={`relative h-7 text-[11px] font-medium rounded-md transition-all duration-100
                ${future ? 'text-slate-700 cursor-not-allowed' : 'cursor-pointer'}
                ${selected ? 'bg-[#D6FF03] text-black font-bold z-10' : ''}
                ${inRange && !selected ? 'bg-[#D6FF03]/15 text-[#D6FF03]' : ''}
                ${!selected && !inRange && !future ? 'text-slate-300 hover:bg-slate-700' : ''}
                ${today && !selected ? 'ring-1 ring-[#D6FF03]/50' : ''}
              `}
            >
              {d.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(null); // null | 'start' picked, waiting for end
  const [tempStart, setTempStart] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(dayjs(startDate || undefined).startOf('month'));
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSelecting(null);
        setTempStart(null);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const startDay = useMemo(() => startDate ? dayjs(startDate) : null, [startDate]);
  const endDay = useMemo(() => endDate ? dayjs(endDate) : null, [endDate]);

  const applyRange = (s, e) => {
    const [lo, hi] = s.isBefore(e) ? [s, e] : [e, s];
    onStartChange(lo.format('YYYY-MM-DD'));
    onEndChange(hi.format('YYYY-MM-DD'));
    setSelecting(null);
    setTempStart(null);
    setOpen(false);
  };

  const handleDateClick = (d) => {
    if (!selecting) {
      // First click — pick start
      setTempStart(d);
      setSelecting('end');
    } else {
      // Second click — pick end and apply
      applyRange(tempStart, d);
    }
  };

  const handlePreset = (preset) => {
    const [s, e] = preset.getRange();
    onStartChange(s.format('YYYY-MM-DD'));
    onEndChange(e.format('YYYY-MM-DD'));
    setOpen(false);
    setSelecting(null);
    setTempStart(null);
  };

  const displayStart = selecting ? tempStart : startDay;
  const displayEnd = selecting ? null : endDay;

  const leftMonth = viewMonth;
  const rightMonth = viewMonth.add(1, 'month');

  const displayText = startDay && endDay
    ? `${startDay.format('MMM D, YYYY')} – ${endDay.format('MMM D, YYYY')}`
    : 'Select dates';

  const dayCount = startDay && endDay ? endDay.diff(startDay, 'day') + 1 : 0;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-[#D6FF03]" />
        <span className="text-slate-200 font-medium">{displayText}</span>
        {dayCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D6FF03]/15 text-[#D6FF03] font-bold">
            {dayCount}d
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
            style={{ width: 'min(640px, 95vw)' }}
          >
            <div className="flex flex-col sm:flex-row">
              {/* Presets sidebar */}
              <div className="sm:w-36 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-700/50 p-2 sm:p-3">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-1">Quick Select</p>
                <div className="flex flex-wrap sm:flex-col gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(p)}
                      className="text-left px-2 py-1.5 text-xs text-slate-300 hover:bg-[#D6FF03]/10 hover:text-[#D6FF03] rounded-md transition-colors font-medium whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar area */}
              <div className="flex-1 p-3 sm:p-4">
                {/* Selection hint */}
                <div className="text-center text-[11px] text-slate-400 mb-3">
                  {selecting
                    ? <span className="text-[#D6FF03]">Click to select end date</span>
                    : 'Click a date to start selecting a range'}
                </div>

                {/* Month navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setViewMonth(v => v.subtract(1, 'month'))}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMonth(v => v.add(1, 'month'))}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Dual calendar grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <CalendarMonth
                    month={leftMonth}
                    start={displayStart}
                    end={displayEnd}
                    hoverDate={selecting ? hoverDate : null}
                    onDateClick={handleDateClick}
                    onDateHover={setHoverDate}
                  />
                  <CalendarMonth
                    month={rightMonth}
                    start={displayStart}
                    end={displayEnd}
                    hoverDate={selecting ? hoverDate : null}
                    onDateClick={handleDateClick}
                    onDateHover={setHoverDate}
                  />
                </div>

                {/* Footer with current selection */}
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {displayStart && (
                      <span className="text-slate-200 font-medium">{displayStart.format('MMM D, YYYY')}</span>
                    )}
                    {displayStart && displayEnd && (
                      <span> — <span className="text-slate-200 font-medium">{displayEnd.format('MMM D, YYYY')}</span></span>
                    )}
                    {selecting && <span className="text-[#D6FF03] ml-1">→ ...</span>}
                  </div>
                  <button
                    onClick={() => { setOpen(false); setSelecting(null); setTempStart(null); }}
                    className="px-3 py-1 text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}