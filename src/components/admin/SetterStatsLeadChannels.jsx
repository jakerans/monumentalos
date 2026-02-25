import React, { useMemo } from 'react';
import { Megaphone } from 'lucide-react';

const SOURCE_LABELS = {
  form: 'Form',
  msg: 'MSG',
  quiz: 'Quiz',
  inbound_call: 'Inbound Call',
  agency: 'Agency',
};

const fmt = (n) => n != null ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—';
const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(1) : '—';

const bookColor = (v) => v === '—' ? 'text-slate-500' : parseFloat(v) >= 40 ? 'text-green-400' : parseFloat(v) >= 20 ? 'text-amber-400' : 'text-red-400';
const showColor = (v) => v === '—' ? 'text-slate-500' : parseFloat(v) >= 70 ? 'text-green-400' : parseFloat(v) >= 50 ? 'text-amber-400' : 'text-red-400';
const closeColor = (v) => v === '—' ? 'text-slate-500' : parseFloat(v) >= 30 ? 'text-green-400' : parseFloat(v) >= 15 ? 'text-amber-400' : 'text-red-400';

const ACCENT_COLORS = [
  'from-violet-500 to-blue-500',
  'from-blue-500 to-cyan-500',
  'from-cyan-500 to-teal-500',
  'from-teal-500 to-emerald-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
];

export default function SetterStatsLeadChannels({ leads, inRange }) {
  const rows = useMemo(() => {
    const periodLeads = leads.filter(l =>
      (l.lead_received_date && inRange(l.lead_received_date)) ||
      (!l.lead_received_date && l.created_date && inRange(l.created_date))
    );

    const groups = {};
    periodLeads.forEach(l => {
      const src = l.lead_source || 'unknown';
      if (!groups[src]) groups[src] = [];
      groups[src].push(l);
    });

    const channelRows = Object.entries(groups).map(([source, srcLeads]) => {
      const total = srcLeads.length;
      const booked = srcLeads.filter(l => l.status === 'appointment_booked' || l.status === 'completed' || l.date_appointment_set).length;
      const showed = srcLeads.filter(l => l.disposition === 'showed').length;
      const closed = srcLeads.filter(l => l.outcome === 'sold').length;
      const totalRevenue = srcLeads.reduce((s, l) => s + (l.outcome === 'sold' && l.sale_amount ? l.sale_amount : 0), 0);
      const avgRevPerBooking = booked > 0 ? totalRevenue / booked : null;

      return {
        source,
        label: SOURCE_LABELS[source] || source.charAt(0).toUpperCase() + source.slice(1),
        total,
        booked,
        showed,
        closed,
        bookingPct: pct(booked, total),
        showPct: pct(showed, booked),
        closePct: pct(closed, booked),
        totalRevenue,
        avgRevPerBooking,
      };
    }).sort((a, b) => b.total - a.total);

    // Totals row
    const allTotal = channelRows.reduce((s, r) => s + r.total, 0);
    const allBooked = channelRows.reduce((s, r) => s + r.booked, 0);
    const allShowed = channelRows.reduce((s, r) => s + r.showed, 0);
    const allClosed = channelRows.reduce((s, r) => s + r.closed, 0);
    const allRevenue = channelRows.reduce((s, r) => s + r.totalRevenue, 0);

    const totalsRow = {
      source: '_total',
      label: 'All Channels',
      total: allTotal,
      booked: allBooked,
      showed: allShowed,
      closed: allClosed,
      bookingPct: pct(allBooked, allTotal),
      showPct: pct(allShowed, allBooked),
      closePct: pct(allClosed, allBooked),
      totalRevenue: allRevenue,
      avgRevPerBooking: allBooked > 0 ? allRevenue / allBooked : null,
    };

    return { channelRows, totalsRow };
  }, [leads, inRange]);

  const maxTotal = Math.max(...rows.channelRows.map(r => r.total), 1);

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Lead Channel Breakdown</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.channelRows.filter(r => r.total > 0).map((r, i) => (
            <ChannelCard key={r.source} row={r} accentIndex={i} maxTotal={maxTotal} />
          ))}
          <TotalsCard row={rows.totalsRow} />
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ row: r, accentIndex, maxTotal }) {
  const gradient = ACCENT_COLORS[accentIndex % ACCENT_COLORS.length];
  const barOpacity = 0.4 + (r.total / maxTotal) * 0.6;

  return (
    <div className="relative rounded-lg border border-slate-700/50 bg-slate-800/40 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${gradient}`} style={{ opacity: barOpacity }} />
      <div className="px-3.5 py-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">{r.label}</span>
          <span className="text-[10px] font-medium bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
            {r.total} lead{r.total !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Primary */}
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl font-bold text-purple-400">{r.booked}</span>
            <span className="text-xs text-slate-500 ml-1">booked</span>
          </div>
          <span className={`text-lg font-semibold ${bookColor(r.bookingPct)}`}>
            {r.bookingPct !== '—' ? `${r.bookingPct}%` : '—'}
          </span>
        </div>
        {/* Secondary */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <span className="text-slate-500">Show <span className={`font-medium ${showColor(r.showPct)}`}>{r.showPct !== '—' ? `${r.showPct}%` : '—'}</span></span>
          <span className="text-slate-500">Close <span className={`font-medium ${closeColor(r.closePct)}`}>{r.closePct !== '—' ? `${r.closePct}%` : '—'}</span></span>
          <span className="text-slate-500">Rev <span className="font-medium text-green-300">{fmt(r.totalRevenue)}</span></span>
          <span className="text-slate-500">Avg <span className="font-medium text-sky-400">{r.avgRevPerBooking != null ? fmt(Math.round(r.avgRevPerBooking)) : '—'}</span></span>
        </div>
      </div>
    </div>
  );
}

function TotalsCard({ row: r }) {
  return (
    <div className="relative rounded-lg border border-dashed border-slate-600/60 bg-slate-700/20 overflow-hidden">
      <div className="h-1 bg-slate-600/40" />
      <div className="px-3.5 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-300">{r.label}</span>
          <span className="text-[10px] font-medium bg-slate-600/50 text-slate-400 px-2 py-0.5 rounded-full">
            {r.total} lead{r.total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl font-bold text-purple-400">{r.booked}</span>
            <span className="text-xs text-slate-500 ml-1">booked</span>
          </div>
          <span className={`text-lg font-semibold ${bookColor(r.bookingPct)}`}>
            {r.bookingPct !== '—' ? `${r.bookingPct}%` : '—'}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <span className="text-slate-500">Show <span className={`font-medium ${showColor(r.showPct)}`}>{r.showPct !== '—' ? `${r.showPct}%` : '—'}</span></span>
          <span className="text-slate-500">Close <span className={`font-medium ${closeColor(r.closePct)}`}>{r.closePct !== '—' ? `${r.closePct}%` : '—'}</span></span>
          <span className="text-slate-500">Rev <span className="font-medium text-green-300">{fmt(r.totalRevenue)}</span></span>
          <span className="text-slate-500">Avg <span className="font-medium text-sky-400">{r.avgRevPerBooking != null ? fmt(Math.round(r.avgRevPerBooking)) : '—'}</span></span>
        </div>
      </div>
    </div>
  );
}