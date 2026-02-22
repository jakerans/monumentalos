import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Palmtree, Plus } from 'lucide-react';
import PendingCoverRequests from './PendingCoverRequests';
import PTORequestModal from './PTORequestModal';
import MyPTORequests from './MyPTORequests';

const STATUS_COLORS = {
  scheduled: 'bg-green-500',
  off: 'bg-slate-500',
  pto: 'bg-blue-500',
  covered: 'bg-amber-500',
  called_out: 'bg-red-500',
};

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  off: 'Day Off',
  pto: 'PTO',
  covered: 'Covered',
  called_out: 'Called Out',
};

function formatShiftTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function ScheduleDayRow({ schedule, dateStr, isToday }) {
  const isOff = !schedule || schedule.status === 'off' || schedule.status === 'pto' || schedule.status === 'called_out';
  const status = schedule?.status || 'off';

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
      isToday ? 'border-[#D6FF03]/30 bg-[#D6FF03]/5' : 'border-slate-700/40 bg-slate-800/40'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[status] || STATUS_COLORS.off}`} />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${isToday ? 'text-[#D6FF03]' : 'text-white'}`}>
            {formatDayDate(dateStr)}
            {isToday && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#D6FF03]/70">Today</span>}
          </p>
          {!isOff && schedule?.shift_start && schedule?.shift_end ? (
            <p className="text-xs text-slate-400">{formatShiftTime(schedule.shift_start)} – {formatShiftTime(schedule.shift_end)}</p>
          ) : (
            <p className="text-xs text-slate-500">{STATUS_LABELS[status] || 'No shift'}</p>
          )}
        </div>
      </div>
      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
        status === 'scheduled' ? 'bg-green-500/10 text-green-400' :
        status === 'pto' ? 'bg-blue-500/10 text-blue-400' :
        status === 'called_out' ? 'bg-red-500/10 text-red-400' :
        status === 'covered' ? 'bg-amber-500/10 text-amber-400' :
        'bg-slate-700/50 text-slate-500'
      }`}>
        {STATUS_LABELS[status] || 'Off'}
      </span>
    </div>
  );
}

function getWeekDates(mondayStr) {
  const dates = [];
  const d = new Date(mondayStr + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export default function MyScheduleTab({ workspaceData, userId, unopenedBoxes }) {
  const [ptoModalOpen, setPtoModalOpen] = useState(false);
  const weekSchedule = workspaceData?.weekSchedule || [];
  const nextWeekSchedule = workspaceData?.nextWeekSchedule || [];
  const ptoBank = workspaceData?.ptoBank || { days_available: 0, days_earned: 0, days_used: 0 };
  const todayStr = new Date().toISOString().split('T')[0];

  const thisMondayStr = getMonday(new Date());
  const nextMondayStr = (() => {
    const d = new Date(thisMondayStr + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const thisWeekDates = getWeekDates(thisMondayStr);
  const nextWeekDates = getWeekDates(nextMondayStr);

  const scheduleLookup = {};
  weekSchedule.forEach(s => { scheduleLookup[s.date] = s; });
  nextWeekSchedule.forEach(s => { scheduleLookup[s.date] = s; });

  // Fetch my requests to know existing request dates (for disabling in modal)
  const { data: myReqData, refetch: refetchMyRequests } = useQuery({
    queryKey: ['my-pto-requests', userId],
    queryFn: async () => {
      const res = await base44.functions.invoke('managePTORequest', {
        action: 'get_my_requests',
        setter_id: userId,
      });
      return res.data?.requests || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const existingRequestDates = (myReqData || [])
    .filter(r => r.status !== 'cancelled' && r.status !== 'denied')
    .map(r => r.request_date);

  return (
    <div className="space-y-4">
      {/* Pending cover requests */}
      <PendingCoverRequests setterId={userId} onActionComplete={refetchMyRequests} />

      {/* PTO Balance + Request button */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center gap-3">
          <Palmtree className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">PTO Balance: <span className="text-blue-400">{ptoBank.days_available} day{ptoBank.days_available !== 1 ? 's' : ''} available</span></p>
            <p className="text-[10px] text-slate-500">{ptoBank.days_earned} earned · {ptoBank.days_used} used</p>
          </div>
        </div>
        <button
          onClick={() => setPtoModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-black hover:opacity-90"
          style={{ backgroundColor: '#D6FF03' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Request PTO
        </button>
      </div>

      {/* This Week */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-[#D6FF03]" />
          <h3 className="text-sm font-semibold text-white">This Week</h3>
        </div>
        <div className="space-y-1.5">
          {thisWeekDates.map(d => (
            <ScheduleDayRow key={d} dateStr={d} schedule={scheduleLookup[d]} isToday={d === todayStr} />
          ))}
        </div>
      </div>

      {/* Next Week */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-400">Next Week</h3>
        </div>
        <div className="space-y-1.5 opacity-80">
          {nextWeekDates.map(d => (
            <ScheduleDayRow key={d} dateStr={d} schedule={scheduleLookup[d]} isToday={false} />
          ))}
        </div>
      </div>

      {/* My PTO Requests */}
      <MyPTORequests setterId={userId} />

      {/* PTO Request Modal */}
      <PTORequestModal
        open={ptoModalOpen}
        onOpenChange={setPtoModalOpen}
        setterId={userId}
        existingRequestDates={existingRequestDates}
        onCreated={refetchMyRequests}
        ptoBalance={ptoBank}
        unopenedBoxes={unopenedBoxes}
      />
    </div>
  );
}