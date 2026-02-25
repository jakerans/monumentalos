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

  const thClass = "text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2.5 text-right whitespace-nowrap";
  const tdClass = "px-3 py-3 text-sm text-right";

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Lead Channel Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className={`${thClass} text-left`}>Channel</th>
              <th className={thClass}>Leads</th>
              <th className={thClass}>Booked</th>
              <th className={thClass}>Book %</th>
              <th className={thClass}>Showed</th>
              <th className={thClass}>Show %</th>
              <th className={thClass}>Closed</th>
              <th className={thClass}>Close %</th>
              <th className={thClass}>Revenue</th>
              <th className={thClass}>Avg Rev / Booking</th>
            </tr>
          </thead>
          <tbody>
            {rows.channelRows.map(r => (
              <tr key={r.source} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                <td className={`${tdClass} text-left font-medium text-white`}>{r.label}</td>
                <td className={`${tdClass} text-slate-300`}>{r.total}</td>
                <td className={`${tdClass} text-purple-400 font-semibold`}>{r.booked}</td>
                <td className={`${tdClass} text-cyan-400`}>{r.bookingPct !== '—' ? `${r.bookingPct}%` : '—'}</td>
                <td className={`${tdClass} text-green-400 font-semibold`}>{r.showed}</td>
                <td className={`${tdClass} text-emerald-400`}>{r.showPct !== '—' ? `${r.showPct}%` : '—'}</td>
                <td className={`${tdClass} text-amber-400 font-semibold`}>{r.closed}</td>
                <td className={`${tdClass} text-amber-300`}>{r.closePct !== '—' ? `${r.closePct}%` : '—'}</td>
                <td className={`${tdClass} text-green-300`}>{fmt(r.totalRevenue)}</td>
                <td className={`${tdClass} text-sky-400`}>{r.avgRevPerBooking != null ? fmt(Math.round(r.avgRevPerBooking)) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600/40 bg-slate-800/60">
              <td className={`${tdClass} text-left font-bold text-white`}>{rows.totalsRow.label}</td>
              <td className={`${tdClass} font-bold text-white`}>{rows.totalsRow.total}</td>
              <td className={`${tdClass} font-bold text-purple-400`}>{rows.totalsRow.booked}</td>
              <td className={`${tdClass} font-bold text-cyan-400`}>{rows.totalsRow.bookingPct !== '—' ? `${rows.totalsRow.bookingPct}%` : '—'}</td>
              <td className={`${tdClass} font-bold text-green-400`}>{rows.totalsRow.showed}</td>
              <td className={`${tdClass} font-bold text-emerald-400`}>{rows.totalsRow.showPct !== '—' ? `${rows.totalsRow.showPct}%` : '—'}</td>
              <td className={`${tdClass} font-bold text-amber-400`}>{rows.totalsRow.closed}</td>
              <td className={`${tdClass} font-bold text-amber-300`}>{rows.totalsRow.closePct !== '—' ? `${rows.totalsRow.closePct}%` : '—'}</td>
              <td className={`${tdClass} font-bold text-green-300`}>{fmt(rows.totalsRow.totalRevenue)}</td>
              <td className={`${tdClass} font-bold text-sky-400`}>{rows.totalsRow.avgRevPerBooking != null ? fmt(Math.round(rows.totalsRow.avgRevPerBooking)) : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}