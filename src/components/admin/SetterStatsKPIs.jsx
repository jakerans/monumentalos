import React from 'react';
import { Calendar, Timer, Ban, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const h = 40;
  const w = 64;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function DeltaBadge({ current, prior, invert = false, isPercent = false }) {
  if (prior == null || current == null) return null;
  const diff = current - prior;
  if (diff === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
      <Minus className="w-2.5 h-2.5" /> 0{isPercent ? 'pp' : ''}
    </span>
  );
  const positive = invert ? diff < 0 : diff > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const cls = positive ? 'text-emerald-400' : 'text-red-400';
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`flex items-center gap-0.5 text-[10px] ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {sign}{isPercent ? `${diff.toFixed(1)}pp` : diff}
    </span>
  );
}

function HealthDot({ color }) {
  if (!color) return null;
  return <span className={`inline-block w-2 h-2 rounded-full ${color} shrink-0`} />;
}

function KPICard({ label, value, icon: Icon, color, bg, sparkData, sparkColor, current, prior, invert, isPercent, dotColor }) {
  return (
    <div className={`${bg} rounded-xl p-4 sm:p-5 border border-slate-700/30 flex flex-col justify-between min-w-0`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <HealthDot color={dotColor} />
            <p className={`text-2xl sm:text-3xl font-bold ${color} truncate`}>{value}</p>
          </div>
          <DeltaBadge current={current} prior={prior} invert={invert} isPercent={isPercent} />
        </div>
        <MiniSparkline data={sparkData} color={sparkColor || '#94a3b8'} />
      </div>
    </div>
  );
}

export default function SetterStatsKPIs({ totalLeadsGenerated, totalBooked, totalDQ, avgSTL, bookingRate, prior = {}, sparklines = {} }) {
  const stlColor = avgSTL != null && avgSTL <= 5 ? 'text-green-400' : avgSTL != null && avgSTL <= 15 ? 'text-amber-400' : 'text-blue-400';
  const stlBg = avgSTL != null && avgSTL <= 5 ? 'bg-green-500/10' : avgSTL != null && avgSTL <= 15 ? 'bg-amber-500/10' : 'bg-blue-500/10';
  const stlSparkColor = avgSTL != null && avgSTL <= 5 ? '#4ade80' : avgSTL != null && avgSTL <= 15 ? '#fbbf24' : '#60a5fa';
  const stlDot = avgSTL != null ? (avgSTL <= 5 ? 'bg-green-400' : avgSTL <= 15 ? 'bg-amber-400' : 'bg-red-400') : null;

  const brDot = bookingRate != null ? (bookingRate >= 40 ? 'bg-green-400' : bookingRate >= 20 ? 'bg-amber-400' : 'bg-red-400') : null;

  const cards = [
    { label: 'Total Leads', value: totalLeadsGenerated, icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10', sparkData: sparklines.leads, sparkColor: '#38bdf8', current: totalLeadsGenerated, prior: prior.totalLeads },
    { label: 'Bookings', value: totalBooked, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', sparkData: sparklines.booked, sparkColor: '#c084fc', current: totalBooked, prior: prior.booked },
    { label: 'Booking Rate', value: bookingRate != null ? `${bookingRate}%` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', sparkColor: '#22d3ee', current: bookingRate, prior: prior.bookingRate, isPercent: true, dotColor: brDot },
    { label: 'Avg STL', value: avgSTL != null ? `${avgSTL}m` : '—', icon: Timer, color: stlColor, bg: stlBg, sparkColor: stlSparkColor, current: avgSTL, prior: prior.avgSTL, invert: true, dotColor: stlDot },
    { label: "DQ'd Leads", value: totalDQ, icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10', sparkData: sparklines.dq, sparkColor: '#f87171', current: totalDQ, prior: prior.dq, invert: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {cards.map(c => <KPICard key={c.label} {...c} />)}
    </div>
  );
}