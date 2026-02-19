import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Timer, Calendar, Target, TrendingUp, Award } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';
import AnimatedTable from '../shared/AnimatedTable';

dayjs.extend(isBetween);

export default function SetterPerformanceTable({ users, leads, clients, startDate, endDate }) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const inRange = (d) => d ? dayjs(d).isBetween(start, end, null, '[]') : false;
  const setters = users.filter(u => u.app_role === 'setter');
  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const stats = useMemo(() => setters.map(setter => {
    const firstCalls = leads.filter(l => l.setter_id === setter.id && l.first_call_made_date && inRange(l.first_call_made_date));
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && inRange(l.date_appointment_set));
    const showed = booked.filter(l => l.disposition === 'showed');
    const dq = leads.filter(l => l.setter_id === setter.id && l.status === 'disqualified' && inRange(l.first_call_made_date));
    const stlValues = firstCalls.filter(l => l.speed_to_lead_minutes != null).map(l => l.speed_to_lead_minutes);
    const avgSTL = stlValues.length ? Math.round(stlValues.reduce((a, b) => a + b, 0) / stlValues.length) : null;
    const bookingRate = firstCalls.length > 0 ? ((booked.length / firstCalls.length) * 100).toFixed(1) : 0;
    const showRate = booked.length > 0 ? ((showed.length / booked.length) * 100).toFixed(1) : 0;
    const revenue = leads.filter(l => l.booked_by_setter_id === setter.id && l.outcome === 'sold' && l.sale_amount && l.date_sold && inRange(l.date_sold)).reduce((s, l) => s + (l.sale_amount || 0), 0);
    return { id: setter.id, name: setter.full_name, firstCalls: firstCalls.length, booked: booked.length, showed: showed.length, dq: dq.length, avgSTL, bookingRate: parseFloat(bookingRate), showRate: parseFloat(showRate), revenue };
  }).sort((a, b) => b.booked - a.booked), [setters, leads, startDate, endDate]);

  const totalBooked = stats.reduce((s, r) => s + r.booked, 0);
  const totalShowed = stats.reduce((s, r) => s + r.showed, 0);
  const totalCalls = stats.reduce((s, r) => s + r.firstCalls, 0);
  const allSTLValues = stats.filter(r => r.avgSTL != null).map(r => r.avgSTL);
  const overallAvgSTL = allSTLValues.length ? Math.round(allSTLValues.reduce((a, b) => a + b, 0) / allSTLValues.length) : null;

  const summaryCards = [
    { label: 'Total Setters', value: setters.length, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8' },
    { label: 'Avg Speed to Lead', value: overallAvgSTL != null ? `${overallAvgSTL}m` : '—', icon: Timer, color: overallAvgSTL != null && overallAvgSTL <= 5 ? 'text-green-400' : overallAvgSTL != null && overallAvgSTL <= 15 ? 'text-amber-400' : 'text-blue-400', bg: overallAvgSTL != null && overallAvgSTL <= 5 ? 'bg-green-500/10' : overallAvgSTL != null && overallAvgSTL <= 15 ? 'bg-amber-500/10' : 'bg-blue-500/10', spark: '#60a5fa' },
    { label: 'Total Booked', value: totalBooked, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc' },
    { label: 'Total Showed', value: totalShowed, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399' },
    { label: 'Avg Booking Rate', value: totalCalls > 0 ? `${((totalBooked / totalCalls) * 100).toFixed(1)}%` : '—', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24' },
  ];

  const columns = [
    {
      key: 'rank', label: '#', align: 'left', sortable: false,
      render: (r, i) => (
        <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
          i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-600 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
        }`}>{i + 1}</span>
      ),
    },
    { key: 'name', label: 'Setter', align: 'left', sortable: true, render: (r) => <span className="font-medium text-white">{r.name}</span> },
    { key: 'firstCalls', label: 'First Calls', align: 'right', sortable: true, render: (r) => <span className="text-slate-300">{r.firstCalls}</span> },
    { key: 'booked', label: 'Booked', align: 'right', sortable: true, render: (r) => <span className="font-bold text-blue-400">{r.booked}</span> },
    { key: 'showed', label: 'Showed', align: 'right', sortable: true, render: (r) => <span className="font-medium text-green-400">{r.showed}</span> },
    { key: 'dq', label: "DQ'd", align: 'right', sortable: true, render: (r) => <span className="text-red-400">{r.dq}</span> },
    {
      key: 'avgSTL', label: 'Avg STL', align: 'right', sortable: true,
      render: (r) => r.avgSTL != null
        ? <span className={`font-medium ${r.avgSTL <= 5 ? 'text-green-400' : r.avgSTL <= 15 ? 'text-amber-400' : 'text-red-400'}`}>{r.avgSTL}m</span>
        : <span className="text-slate-500">—</span>,
    },
    { key: 'bookingRate', label: 'Booking %', align: 'right', sortable: true, render: (r) => <span className="font-medium text-slate-300">{r.bookingRate}%</span> },
    { key: 'showRate', label: 'Show %', align: 'right', sortable: true, render: (r) => <span className="font-medium text-slate-300">{r.showRate}%</span> },
    {
      key: 'revenue', label: 'Revenue', align: 'right', sortable: true,
      render: (r) => <span className="font-bold text-emerald-400">{r.revenue > 0 ? `$${r.revenue.toLocaleString()}` : '—'}</span>,
    },
  ];

  const mobileCard = (r, i) => (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
            i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-600 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
          }`}>{i + 1}</span>
          <span className="font-medium text-white text-sm">{r.name}</span>
        </div>
        {r.avgSTL != null && (
          <span className={`text-xs font-medium ${r.avgSTL <= 5 ? 'text-green-400' : r.avgSTL <= 15 ? 'text-amber-400' : 'text-red-400'}`}>{r.avgSTL}m STL</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-[11px]">
        <div><span className="text-slate-500">Calls</span><p className="text-slate-300 font-medium">{r.firstCalls}</p></div>
        <div><span className="text-slate-500">Booked</span><p className="text-blue-400 font-bold">{r.booked}</p></div>
        <div><span className="text-slate-500">Showed</span><p className="text-green-400 font-medium">{r.showed}</p></div>
        <div><span className="text-slate-500">DQ</span><p className="text-red-400">{r.dq}</p></div>
      </div>
      <div className="flex gap-2 text-[11px]">
        <span className="text-slate-500">Booking: <span className="text-slate-300">{r.bookingRate}%</span></span>
        <span className="text-slate-500">Show: <span className="text-slate-300">{r.showRate}%</span></span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map((c, i) => (
          <SparklineCard key={c.label} index={i} label={c.label} value={c.value} icon={c.icon} iconBg={c.bg} iconColor={c.color} sparkColor={c.spark} />
        ))}
      </div>
      <AnimatedTable
        columns={columns}
        data={stats}
        title="Individual Setter Stats"
        emptyMessage="No setters found"
        initialSort={{ key: 'booked', direction: 'desc' }}
        mobileCardRender={mobileCard}
      />
    </div>
  );
}