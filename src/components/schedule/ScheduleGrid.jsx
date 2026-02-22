import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, Edit2, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_COLORS = {
  scheduled: 'bg-green-500',
  off: 'bg-slate-500',
  pto: 'bg-blue-500',
  covered: 'bg-amber-500',
  called_out: 'bg-red-500',
};

function formatShiftTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'p' : 'a';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

function getDatesForWeek(weekStart) {
  const dates = [];
  const d = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function ScheduleCell({ schedule, onUpdated }) {
  const [editMode, setEditMode] = useState(false);
  const [editStart, setEditStart] = useState(schedule?.shift_start || '09:00');
  const [editEnd, setEditEnd] = useState(schedule?.shift_end || '17:00');
  const [editStatus, setEditStatus] = useState(schedule?.status || 'scheduled');
  const [loading, setLoading] = useState(false);

  if (!schedule) {
    return <td className="border border-slate-700/40 p-1.5 text-center text-xs text-slate-600">—</td>;
  }

  const handleUpdate = async () => {
    setLoading(true);
    await base44.functions.invoke('manageSetterSchedule', {
      action: 'update',
      schedule_id: schedule.id,
      shift_start: editStart,
      shift_end: editEnd,
      status: editStatus,
    });
    toast({ title: 'Schedule updated' });
    setEditMode(false);
    setLoading(false);
    onUpdated();
  };

  const handleDelete = async () => {
    setLoading(true);
    await base44.functions.invoke('manageSetterSchedule', {
      action: 'delete',
      schedule_id: schedule.id,
    });
    toast({ title: 'Schedule entry deleted' });
    setLoading(false);
    onUpdated();
  };

  return (
    <td className="border border-slate-700/40 p-1">
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full px-1.5 py-1 rounded text-xs hover:bg-slate-700/50 transition-colors text-left">
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[schedule.status] || STATUS_COLORS.scheduled}`} />
              {schedule.status === 'off' ? (
                <span className="text-slate-500">Off</span>
              ) : schedule.status === 'pto' ? (
                <span className="text-blue-400">PTO</span>
              ) : schedule.status === 'called_out' ? (
                <span className="text-red-400">Out</span>
              ) : (
                <span className="text-slate-300">{formatShiftTime(schedule.shift_start)}–{formatShiftTime(schedule.shift_end)}</span>
              )}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-slate-800 border-slate-700 p-3 text-sm" side="bottom">
          {!editMode ? (
            <div className="space-y-2">
              <p className="text-white font-medium">{formatShiftTime(schedule.shift_start)} – {formatShiftTime(schedule.shift_end)}</p>
              <p className="text-slate-400 text-xs capitalize">Status: {schedule.status?.replace('_', ' ')}</p>
              {schedule.notes && <p className="text-slate-500 text-xs">{schedule.notes}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditMode(true)} className="flex items-center gap-1 text-xs text-[#D6FF03] hover:underline">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={handleDelete} disabled={loading} className="flex items-center gap-1 text-xs text-red-400 hover:underline disabled:opacity-50">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white" />
                <input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white" />
              </div>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white">
                <option value="scheduled">Scheduled</option>
                <option value="off">Off</option>
                <option value="called_out">Called Out</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleUpdate} disabled={loading} className="flex-1 px-2 py-1 text-xs font-bold rounded bg-[#D6FF03] text-black disabled:opacity-50">Save</button>
                <button onClick={() => setEditMode(false)} className="px-2 py-1 text-xs rounded border border-slate-600 text-slate-300">Cancel</button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </td>
  );
}

function ScheduleGrid({ schedules, setters, weekStart, onUpdated }) {
  const dates = getDatesForWeek(weekStart);
  const todayStr = new Date().toISOString().split('T')[0];

  // Build lookup: setter_id + date -> schedule
  const lookup = {};
  schedules.forEach(s => {
    lookup[`${s.setter_id}_${s.date}`] = s;
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80">
            <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 border-b border-slate-700/50 sticky left-0 bg-slate-800/80 z-10 min-w-[120px]">Setter</th>
            {dates.map((d, i) => {
              const isToday = d === todayStr;
              const dayNum = new Date(d + 'T00:00:00').getDate();
              return (
                <th key={d} className={`px-2 py-2 text-xs font-medium border-b border-slate-700/50 text-center min-w-[90px] ${isToday ? 'text-[#D6FF03]' : 'text-slate-400'}`}>
                  {DAY_LABELS[i]} {dayNum}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {setters.map(setter => (
            <tr key={setter.id} className="hover:bg-slate-800/30">
              <td className="px-3 py-2 text-xs font-medium text-white border-b border-slate-700/30 sticky left-0 bg-slate-900/90 z-10 whitespace-nowrap">
                {setter.full_name}
              </td>
              {dates.map(d => (
                <ScheduleCell
                  key={d}
                  schedule={lookup[`${setter.id}_${d}`]}
                  onUpdated={onUpdated}
                />
              ))}
            </tr>
          ))}
          {setters.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-8 text-sm text-slate-500">No active setters found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(ScheduleGrid);