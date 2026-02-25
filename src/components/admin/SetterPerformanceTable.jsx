import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Timer, Calendar, Target, TrendingUp, Award, DollarSign, ArrowUpDown } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';
import AnimatedTable from '../shared/AnimatedTable';
import RevenueTooltip from './RevenueTooltip';

dayjs.extend(isBetween);

function calcSetterStats(setters, leads, clients, inRange) {
  return setters.map(setter => {
    const firstCalls = leads.filter(l => l.setter_id === setter.id && l.first_call_made_date && inRange(l.first_call_made_date));
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && inRange(l.date_appointment_set));
    const showed = booked.filter(l => l.disposition === 'showed');
    const dq = leads.filter(l => l.setter_id === setter.id && l.status === 'disqualified' && inRange(l.first_call_made_date));
    const totalLeads = leads.filter(l => l.setter_id === setter.id && (
      (l.lead_received_date && inRange(l.lead_received_date)) || 
      (!l.lead_received_date && l.created_date && inRange(l.created_date))
    )).length;
    const stlValues = firstCalls.filter(l => l.speed_to_lead_minutes != null).map(l => l.speed_to_lead_minutes);
    const avgSTL = stlValues.length ? Math.round(stlValues.reduce((a, b) => a + b, 0) / stlValues.length) : null;
    const bookingRate = totalLeads > 0 ? ((booked.length / totalLeads) * 100).toFixed(1) : 0;
    const showRate = booked.length > 0 ? ((showed.length / booked.length) * 100).toFixed(1) : 0;
    let setRevenue = 0;
    booked.forEach(l => {
      const client = clients.find(c => c.id === l.client_id);
      if (client?.billing_type === 'pay_per_set' && client.price_per_set_appointment) setRevenue += client.price_per_set_appointment;
    });
    const showLeads = leads.filter(l => l.booked_by_setter_id === setter.id && l.disposition === 'showed' && l.appointment_date && inRange(l.appointment_date));
    let showRevenue = 0;
    showLeads.forEach(l => {
      const client = clients.find(c => c.id === l.client_id);
      if (client?.billing_type === 'pay_per_show' && client.price_per_shown_appointment) showRevenue += client.price_per_shown_appointment;
    });
    const revenue = setRevenue + showRevenue;
    return { id: setter.id, name: setter.full_name, firstCalls: firstCalls.length, booked: booked.length, showed: showed.length, dq: dq.length, avgSTL, bookingRate: parseFloat(bookingRate), showRate: parseFloat(showRate), revenue, setRevenue, showRevenue, totalLeads };
  }).sort((a, b) => b.booked - a.booked);
}

function pctChange(curr, prior) {
  if (prior === 0 && curr === 0) return 0;
  if (prior === 0) return 100;
  return Math.round(((curr - prior) / prior) * 100);
}

function buildDailySparkline(leads, dateField, filterFn, startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = end.diff(start, 'day') + 1;
  const buckets = {};
  for (let i = 0; i < days; i++) buckets[start.add(i, 'day').format('YYYY-MM-DD')] = 0;
  leads.forEach(l => {
    const d = l[dateField];
    if (!d || !filterFn(l)) return;
    const key = dayjs(d).format('YYYY-MM-DD');
    if (buckets[key] !== undefined) buckets[key]++;
  });
  return Object.values(buckets).map(v => ({ v }));
}

export default function SetterPerformanceTable({ users, leads, clients, startDate, endDate, priorStart, priorEnd }) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const inRange = (d) => d ? dayjs(d).isBetween(start, end, null, '[]') : false;

  // Prior period range
  const hasPrior = !!priorStart && !!priorEnd;
  const priorStartD = hasPrior ? dayjs(priorStart).startOf('day') : null;
  const priorEndD = hasPrior ? dayjs(priorEnd).endOf('day') : null;
  const inPriorRange = (d) => hasPrior && d ? dayjs(d).isBetween(priorStartD, priorEndD, null, '[]') : false;

  const setters = users.filter(u => u.app_role === 'setter');

  const stats = useMemo(() => calcSetterStats(setters, leads, clients, inRange), [setters, leads, clients, startDate, endDate]);
  const priorStats = useMemo(() => hasPrior ? calcSetterStats(setters, leads, clients, inPriorRange) : [], [setters, leads, clients, priorStart, priorEnd, hasPrior]);

  const totalBooked = stats.reduce((s, r) => s + r.booked, 0);
  const totalShowed = stats.reduce((s, r) => s + r.showed, 0);
  const totalCalls = stats.reduce((s, r) => s + r.firstCalls, 0);
  const totalRevenue = stats.reduce((s, r) => s + r.revenue, 0);
  const totalSetRevenue = stats.reduce((s, r) => s + r.setRevenue, 0);
  const totalShowRevenue = stats.reduce((s, r) => s + r.showRevenue, 0);
  const allSTLValues = stats.filter(r => r.avgSTL != null).map(r => r.avgSTL);
  const overallAvgSTL = allSTLValues.length ? Math.round(allSTLValues.reduce((a, b) => a + b, 0) / allSTLValues.length) : null;

  const pBooked = priorStats.reduce((s, r) => s + r.booked, 0);
  const pShowed = priorStats.reduce((s, r) => s + r.showed, 0);
  const pCalls = priorStats.reduce((s, r) => s + r.firstCalls, 0);
  const pRevenue = priorStats.reduce((s, r) => s + r.revenue, 0);
  const pSetRevenue = priorStats.reduce((s, r) => s + r.setRevenue, 0);
  const pShowRevenue = priorStats.reduce((s, r) => s + r.showRevenue, 0);
  const pSTLValues = priorStats.filter(r => r.avgSTL != null).map(r => r.avgSTL);
  const pAvgSTL = pSTLValues.length ? Math.round(pSTLValues.reduce((a, b) => a + b, 0) / pSTLValues.length) : null;
  const totalLeadsSum = stats.reduce((s, r) => s + r.totalLeads, 0);
  const pTotalLeads = priorStats.reduce((s, r) => s + r.totalLeads, 0);
  const pBookingRate = pTotalLeads > 0 ? ((pBooked / pTotalLeads) * 100).toFixed(1) : 0;
  const currBookingRate = totalLeadsSum > 0 ? ((totalBooked / totalLeadsSum) * 100).toFixed(1) : 0;

  // Sparklines
  const sparkBooked = useMemo(() => buildDailySparkline(leads, 'date_appointment_set', l => setters.some(s => s.id === l.booked_by_setter_id), startDate, endDate), [leads, setters, startDate, endDate]);
  const sparkCalls = useMemo(() => buildDailySparkline(leads, 'first_call_made_date', l => setters.some(s => s.id === l.setter_id), startDate, endDate), [leads, setters, startDate, endDate]);

  const setRevPct = totalRevenue > 0 ? ((totalSetRevenue / totalRevenue) * 100).toFixed(0) : 0;
  const showRevPct = totalRevenue > 0 ? ((totalShowRevenue / totalRevenue) * 100).toFixed(0) : 0;

  const summaryCards = [
    { label: 'Total Setters', value: setters.length, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8' },
    { label: 'Avg Speed to Lead', value: overallAvgSTL != null ? `${overallAvgSTL}m` : '—', icon: Timer, color: overallAvgSTL != null && overallAvgSTL <= 5 ? 'text-green-400' : overallAvgSTL != null && overallAvgSTL <= 15 ? 'text-amber-400' : 'text-blue-400', bg: overallAvgSTL != null && overallAvgSTL <= 5 ? 'bg-green-500/10' : overallAvgSTL != null && overallAvgSTL <= 15 ? 'bg-amber-500/10' : 'bg-blue-500/10', spark: '#60a5fa', comparison: hasPrior && pAvgSTL != null && overallAvgSTL != null ? { prior: `${pAvgSTL}m`, change: pctChange(overallAvgSTL, pAvgSTL), invertColor: true } : null },
    { label: 'Total First Calls', value: totalCalls, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24', sparkData: sparkCalls, comparison: hasPrior ? { prior: pCalls, change: pctChange(totalCalls, pCalls) } : null },
    { label: 'Total Booked', value: totalBooked, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc', sparkData: sparkBooked, comparison: hasPrior ? { prior: pBooked, change: pctChange(totalBooked, pBooked) } : null },
    { label: 'Total Showed', value: totalShowed, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399', comparison: hasPrior ? { prior: pShowed, change: pctChange(totalShowed, pShowed) } : null },
    { label: 'Booking Rate', value: totalLeadsSum > 0 ? `${currBookingRate}%` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', spark: '#22d3ee', comparison: hasPrior && pTotalLeads > 0 ? { prior: `${pBookingRate}%`, change: pctChange(parseFloat(currBookingRate), parseFloat(pBookingRate)) } : null },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', spark: '#34d399', comparison: hasPrior ? { prior: `$${pRevenue.toLocaleString()}`, change: pctChange(totalRevenue, pRevenue) } : null },
    { label: 'Set Revenue', value: `$${totalSetRevenue.toLocaleString()}`, subtitle: `${setRevPct}% of total`, icon: ArrowUpDown, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa', comparison: hasPrior ? { prior: `$${pSetRevenue.toLocaleString()}`, change: pctChange(totalSetRevenue, pSetRevenue) } : null },
    { label: 'Show Revenue', value: `$${totalShowRevenue.toLocaleString()}`, subtitle: `${showRevPct}% of total`, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399', comparison: hasPrior ? { prior: `$${pShowRevenue.toLocaleString()}`, change: pctChange(totalShowRevenue, pShowRevenue) } : null },
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
      render: (r) => (
        <RevenueTooltip revenue={r.revenue} setRevenue={r.setRevenue} showRevenue={r.showRevenue}>
          <span className="font-bold text-emerald-400 cursor-default">{r.revenue > 0 ? `$${r.revenue.toLocaleString()}` : '—'}</span>
        </RevenueTooltip>
      ),
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {summaryCards.map((c, i) => (
          <SparklineCard key={c.label} index={i} label={c.label} value={c.value} subtitle={c.subtitle} icon={c.icon} iconBg={c.bg} iconColor={c.color} sparkColor={c.spark} sparkData={c.sparkData} comparison={c.comparison} />
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