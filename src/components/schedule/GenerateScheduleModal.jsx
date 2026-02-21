import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { CalendarPlus, Loader2 } from 'lucide-react';

const DAY_OPTIONS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function GenerateScheduleModal({ open, onOpenChange, setters, onGenerated }) {
  const [setterId, setSetterId] = useState('all');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(getNextMonday());
  const [endDate, setEndDate] = useState(addDays(getNextMonday(), 27));
  const [loading, setLoading] = useState(false);

  const toggleDay = (val) => {
    setSelectedDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
  };

  const handleSubmit = async () => {
    if (selectedDays.length === 0) {
      toast({ title: 'Select at least one day', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const targetSetters = setterId === 'all' ? setters : setters.filter(s => s.id === setterId);
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const s of targetSetters) {
      const res = await base44.functions.invoke('manageSetterSchedule', {
        action: 'bulk_create',
        setter_id: s.id,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        days_of_week: selectedDays,
        start_date: startDate,
        end_date: endDate,
      });
      if (res.data?.success) {
        totalCreated += res.data.created || 0;
        totalSkipped += res.data.skipped || 0;
      }
    }

    toast({
      title: 'Schedule Generated',
      description: `Created ${totalCreated} shifts, skipped ${totalSkipped} existing`,
    });
    setLoading(false);
    onOpenChange(false);
    onGenerated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CalendarPlus className="w-5 h-5 text-[#D6FF03]" />
            Generate Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Setter select */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Setter</label>
            <select
              value={setterId}
              onChange={e => setSetterId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">All Setters</option>
              {setters.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          {/* Shift times */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Shift Start</label>
              <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Shift End</label>
              <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white" />
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Days of Week</label>
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    selectedDays.includes(d.value)
                      ? 'bg-[#D6FF03]/15 border-[#D6FF03]/40 text-[#D6FF03]'
                      : 'border-slate-700 text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white" />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm font-bold rounded-lg text-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#D6FF03' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}