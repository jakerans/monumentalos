import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SetterStatsTrendChart({ leads, setters, startDate, endDate }) {
  const data = useMemo(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days = end.diff(start, 'day') + 1;
    
    // If range > 60 days, bucket by week. Otherwise daily.
    const byWeek = days > 60;
    const buckets = {};

    for (let i = 0; i < days; i++) {
      const d = start.add(i, 'day');
      const key = byWeek ? d.startOf('week').format('MMM D') : d.format('MMM D');
      if (!buckets[key]) buckets[key] = { label: key, booked: 0, showed: 0, dq: 0 };
    }

    const setterIds = new Set(setters.map(s => s.id));

    leads.forEach(l => {
      // Booked
      if (l.booked_by_setter_id && setterIds.has(l.booked_by_setter_id) && l.date_appointment_set) {
        const d = dayjs(l.date_appointment_set);
        if (d.isBefore(start) || d.isAfter(end)) return;
        const key = byWeek ? d.startOf('week').format('MMM D') : d.format('MMM D');
        if (buckets[key]) buckets[key].booked++;
      }
      // Showed
      if (l.booked_by_setter_id && setterIds.has(l.booked_by_setter_id) && l.disposition === 'showed' && l.appointment_date) {
        const d = dayjs(l.appointment_date);
        if (d.isBefore(start) || d.isAfter(end)) return;
        const key = byWeek ? d.startOf('week').format('MMM D') : d.format('MMM D');
        if (buckets[key]) buckets[key].showed++;
      }
      // DQ by setter
      if (l.status === 'disqualified' && l.disqualified_by_setter_id && setterIds.has(l.disqualified_by_setter_id) && l.disqualified_date) {
        const d = dayjs(l.disqualified_date);
        if (d.isBefore(start) || d.isAfter(end)) return;
        const key = byWeek ? d.startOf('week').format('MMM D') : d.format('MMM D');
        if (buckets[key]) buckets[key].dq++;
      }
    });

    return Object.values(buckets);
  }, [leads, setters, startDate, endDate]);

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Daily Trend — Bookings, Shows & DQs</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="booked" name="Booked" stroke="#c084fc" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="showed" name="Showed" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="dq" name="DQ" stroke="#f87171" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}