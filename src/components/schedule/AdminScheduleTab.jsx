import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import ScheduleGrid from './ScheduleGrid';
import GenerateScheduleModal from './GenerateScheduleModal';
import AdminPTOQueue from './AdminPTOQueue';

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateRange(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function AdminScheduleTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [genOpen, setGenOpen] = useState(false);

  const weekStart = useMemo(() => {
    const mon = getMonday(new Date());
    mon.setDate(mon.getDate() + weekOffset * 7);
    return mon.toISOString().split('T')[0];
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  }, [weekStart]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['team-schedule', weekStart, weekEnd],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageSetterSchedule', {
        action: 'get_team_schedule',
        start_date: weekStart,
        end_date: weekEnd,
      });
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const schedules = data?.schedules || [];
  const setters = data?.setters || [];

  return (
    <div className="space-y-4">
      {/* PTO Queue */}
      <AdminPTOQueue onScheduleChanged={refetch} />

      <div className="border-t border-slate-700/50" />

      {/* Week nav + Generate button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white min-w-[180px] text-center">
            {formatDateRange(weekStart)}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              This Week
            </button>
          )}
        </div>

        <button
          onClick={() => setGenOpen(true)}
          className="px-3 py-1.5 text-xs font-bold rounded-lg text-black flex items-center gap-1.5 hover:opacity-90"
          style={{ backgroundColor: '#D6FF03' }}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Generate Schedule
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-slate-500 text-sm">Loading schedule...</div>
      ) : (
        <ScheduleGrid
          schedules={schedules}
          setters={setters}
          weekStart={weekStart}
          onUpdated={refetch}
        />
      )}

      <GenerateScheduleModal
        open={genOpen}
        onOpenChange={setGenOpen}
        setters={setters}
        onGenerated={refetch}
      />
    </div>
  );
}

export default React.memo(AdminScheduleTab);