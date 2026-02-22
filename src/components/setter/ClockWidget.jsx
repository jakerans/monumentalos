import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatShiftTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function ClockWidget({ workspaceData, onClockAction, userId }) {
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const clockStatus = workspaceData?.clockStatus || null;
  const todaySchedule = workspaceData?.todaySchedule || null;
  const hoursWeek = workspaceData?.hoursThisWeek ?? 0;
  const hoursMonth = workspaceData?.hoursThisMonth ?? 0;
  const isClockedIn = !!clockStatus;

  // Live timer
  useEffect(() => {
    if (!clockStatus?.clock_in) { setElapsed(0); return; }
    const start = new Date(clockStatus.clock_in).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [clockStatus?.clock_in]);

  const handleClockIn = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('clockInOut', { action: 'clock_in' });
    if (res.data?.already_active) {
      toast({ title: "You're already clocked in", variant: 'warning' });
    } else if (res.data?.success) {
      toast({ title: '⏱️ Clocked In', description: `Started at ${new Date(res.data.clock_in).toLocaleTimeString()}`, variant: 'success' });
    }
    onClockAction();
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('clockInOut', { action: 'clock_out' });
    if (res.data?.not_active) {
      toast({ title: "You're not clocked in", variant: 'warning' });
    } else if (res.data?.success) {
      toast({ title: '✅ Clocked Out', description: `Worked ${res.data.total_hours} hours`, variant: 'success' });
    }
    onClockAction();
    setLoading(false);
  };

  const scheduleText = todaySchedule?.shift_start && todaySchedule?.shift_end
    ? `${formatShiftTime(todaySchedule.shift_start)} – ${formatShiftTime(todaySchedule.shift_end)}`
    : null;

  const scheduleStatus = todaySchedule?.status;
  const isOff = scheduleStatus === 'off' || scheduleStatus === 'pto' || scheduleStatus === 'called_out';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-4"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Clock status + timer */}
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isClockedIn ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-800 border border-slate-700'
          }`}>
            <Clock className={`w-5 h-5 ${isClockedIn ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div className="min-w-0">
            {isClockedIn ? (
              <>
                <p className="text-xs text-green-400 font-medium uppercase tracking-wider">Clocked In</p>
                <p className="text-2xl font-mono font-bold text-white tracking-tight">{formatDuration(elapsed)}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Not Clocked In</p>
                <p className="text-sm text-slate-400">Ready to start your shift</p>
              </>
            )}
          </div>
        </div>

        {/* Center: Schedule + hours */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {isOff ? (
              <span className="text-amber-400">{scheduleStatus === 'pto' ? 'PTO' : scheduleStatus === 'called_out' ? 'Called Out' : 'Day Off'}</span>
            ) : scheduleText ? (
              <span className="text-slate-300">{scheduleText}</span>
            ) : (
              <span className="text-slate-500">No shift scheduled</span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
            <span>Week: <span className="text-slate-300 font-medium">{hoursWeek.toFixed(1)}h</span></span>
            <span className="text-slate-700">|</span>
            <span>Month: <span className="text-slate-300 font-medium">{hoursMonth.toFixed(1)}h</span></span>
          </div>
        </div>

        {/* Right: Action button */}
        <div className="flex-shrink-0">
          {isClockedIn ? (
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              Clock Out
            </button>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm text-black hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D6FF03' }}
            >
              <LogIn className="w-4 h-4" />
              Clock In
            </button>
          )}
        </div>
      </div>

      {/* Mobile hours row */}
      <div className="flex sm:hidden items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
        <span>This Week: <span className="text-slate-300 font-medium">{hoursWeek.toFixed(1)}h</span></span>
        <span className="text-slate-700">|</span>
        <span>This Month: <span className="text-slate-300 font-medium">{hoursMonth.toFixed(1)}h</span></span>
      </div>
    </motion.div>
  );
}

export default React.memo(ClockWidget);