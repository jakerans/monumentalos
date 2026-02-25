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
const pctVal = (num, den) => den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : null;

const bookColor = (v) => v == null ? 'text-slate-500' : v >= 40 ? 'text-green-400' : v >= 20 ? 'text-amber-400' : 'text-red-400';
const showColor = (v) => v == null ? 'text-slate-500' : v >= 70 ? 'text-green-400' : v >= 50 ? 'text-amber-400' : 'text-red-400';
const closeColor = (v) => v == null ? 'text-slate-500' : v >= 30 ? 'text-green-400' : v >= 15 ? 'text-amber-400' : 'text-red-400';
const fmtPct = (v) => v != null ? `${v}%` : '—';

const ACCENT_COLORS = [
  'from-purple-500 to-blue-500',
  'from-blue-500 to-cyan-500',
  'from-cyan-500 to-teal-500',
  'from-teal-500 to-emerald-500',
  'from-indigo-500 to-purple-500',
];

function ChannelCard({ row, accentGradient, isSummary }) {
  const bookPct = pctVal(row.booked, row.total);
  const showPct = pctVal(row.showed, row.booked);
  const closePct = pctVal(row.closed, row.booked);

  return (
    <div className={`rounded-xl overflow-hidden ${isSummary ? 'border border-dashed border-slate-600/60 bg-slate-800/20' : 'border border-slate-700/50 bg-slate-800/40'}`}>
      {/* Accent bar */}
      <div className={`h-1 ${isSummary ? 'bg-slate-600/40' : `bg-gradient-to-r ${accentGradient}`}`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${isSummary ? 'text-slate-300' : 'text-white'}`}>{row.label}</span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">{row.total} leads</span>
        </div>

        {/* Primary stat row */}
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl font-bold text-purple-400">{row.booked}</span>
            <span className="text-xs text-slate-500 ml-1">booked</span>
          </div>
          <span className={`text-lg font-bold ${bookColor(bookPct)}`}>{fmtPct(bookPct)}</span>
        </div>

        {/* Secondary stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <div>
            <span className="text-slate-500">Show %</span>{' '}
            <span className={`font-medium ${showColor(showPct)}`}>{fmtPct(showPct)}</span>
          </div>
          <div>
            <span className="text-slate-500">Close %</span>{' '}
            <span className={`font-medium ${closeColor(closePct)}`}>{fmtPct(closePct)}</span>
          </div>
          <div>
            <span className="text-slate-500">Revenue</span>{' '}
            <span className="font-medium text-green-300">{fmt(row.totalRevenue)}</span>
          </div>
          <div>
            <span className="text-slate-500">Avg/Book</span>{' '}
            <span className="font-medium text-sky-400">{row.avgRevPerBooking != null ? fmt(Math.round(row.avgRevPerBooking)) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetterStatsLeadChannels({ leads, inRange }) {
  const { channelRows, totalsRow } = useMemo(() => {
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

    const rows = Object.entries(groups)
      .filter(([, srcLeads]) => srcLeads.length > 0)
      .map(([source, srcLeads]) => {
        const total = srcLeads.length;
        const booked = srcLeads.filter(l => l.status === 'appointment_booked' || l.status === 'completed' || l.date_appointment_set).length;
        const showed = srcLeads.filter(l => l.disposition === 'showed').length;
        const closed = srcLeads.filter(l => l.outcome === 'sold').length;
        const totalRevenue = srcLeads.reduce((s, l) => s + (l.outcome === 'sold' && l.sale_amount ? l.sale_amount : 0), 0);
        return {
          source, label: SOURCE_LABELS[source] || source.charAt(0).toUpperCase() + source.slice(1),
          total, booked, showed, closed, totalRevenue,
          avgRevPerBooking: booked > 0 ? totalRevenue / booked : null,
        };
      })
      .sort((a, b) => b.booked - a.booked);

    const allTotal = rows.reduce((s, r) => s + r.total, 0);
    const allBooked = rows.reduce((s, r) => s + r.booked, 0);
    const allShowed = rows.reduce((s, r) => s + r.showed, 0);
    const allClosed = rows.reduce((s, r) => s + r.closed, 0);
    const allRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);

    return {
      channelRows: rows,
      totalsRow: {
        source: '_total', label: 'All Channels',
        total: allTotal, booked: allBooked, showed: allShowed, closed: allClosed,
        totalRevenue: allRevenue, avgRevPerBooking: allBooked > 0 ? allRevenue / allBooked : null,
      },
    };
  }, [leads, inRange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Lead Channel Breakdown</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {channelRows.map((r, i) => (
          <ChannelCard key={r.source} row={r} accentGradient={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
        ))}
        <ChannelCard row={totalsRow} isSummary />
      </div>
    </div>
  );
}