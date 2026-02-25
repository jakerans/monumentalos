import React, { useMemo } from 'react';
import { Factory } from 'lucide-react';

const INDUSTRY_LABELS = {
  painting: 'Painting',
  epoxy: 'Epoxy',
  kitchen_bath: 'Kitchen & Bath',
  reno: 'Renovation',
  _untagged: 'Untagged',
};

const fmt = (n) => n != null ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—';
const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(1) : '—';

const bookColor = (v) => v === '—' ? 'text-slate-500' : parseFloat(v) >= 40 ? 'text-green-400' : parseFloat(v) >= 20 ? 'text-amber-400' : 'text-red-400';
const showColor = (v) => v === '—' ? 'text-slate-500' : parseFloat(v) >= 70 ? 'text-green-400' : parseFloat(v) >= 50 ? 'text-amber-400' : 'text-red-400';
const closeColor = (v) => v === '—' ? 'text-slate-500' : parseFloat(v) >= 30 ? 'text-green-400' : parseFloat(v) >= 15 ? 'text-amber-400' : 'text-red-400';

export default function LeadChannelByIndustry({ leads, inRange }) {
  const { industryRows, totalsRow } = useMemo(() => {
    const periodLeads = leads.filter(l =>
      (l.lead_received_date && inRange(l.lead_received_date)) ||
      (!l.lead_received_date && l.created_date && inRange(l.created_date))
    );

    const groups = {};

    periodLeads.forEach(l => {
      const industries = l.industries && l.industries.length > 0 ? l.industries : ['_untagged'];
      industries.forEach(ind => {
        if (!groups[ind]) groups[ind] = [];
        groups[ind].push(l);
      });
    });

    const rows = Object.entries(groups).map(([industry, indLeads]) => {
      const total = indLeads.length;
      const booked = indLeads.filter(l => l.status === 'appointment_booked' || l.status === 'completed' || l.date_appointment_set).length;
      const showed = indLeads.filter(l => l.disposition === 'showed').length;
      const closed = indLeads.filter(l => l.outcome === 'sold').length;
      const totalRevenue = indLeads.reduce((s, l) => s + (l.outcome === 'sold' && l.sale_amount ? l.sale_amount : 0), 0);
      const avgRevPerBooking = booked > 0 ? totalRevenue / booked : null;

      return {
        industry,
        label: INDUSTRY_LABELS[industry] || industry.charAt(0).toUpperCase() + industry.slice(1),
        total, booked, showed, closed,
        bookingPct: pct(booked, total),
        showPct: pct(showed, booked),
        closePct: pct(closed, booked),
        totalRevenue, avgRevPerBooking,
      };
    }).sort((a, b) => b.total - a.total);

    const allTotal = rows.reduce((s, r) => s + r.total, 0);
    const allBooked = rows.reduce((s, r) => s + r.booked, 0);
    const allShowed = rows.reduce((s, r) => s + r.showed, 0);
    const allClosed = rows.reduce((s, r) => s + r.closed, 0);
    const allRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);

    return {
      industryRows: rows,
      totalsRow: {
        label: 'All Industries',
        total: allTotal,
        booked: allBooked,
        showed: allShowed,
        closed: allClosed,
        bookingPct: pct(allBooked, allTotal),
        showPct: pct(allShowed, allBooked),
        closePct: pct(allClosed, allBooked),
        totalRevenue: allRevenue,
        avgRevPerBooking: allBooked > 0 ? allRevenue / allBooked : null,
      },
    };
  }, [leads, inRange]);

  const thClass = "text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2.5 text-right whitespace-nowrap";
  const tdClass = "px-3 py-3 text-sm text-right";

  const renderPct = (val, colorFn) => {
    const color = colorFn(val);
    return <span className={color}>{val !== '—' ? `${val}%` : '—'}</span>;
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
        <Factory className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Lead Channel Breakdown by Industry</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className={`${thClass} text-left`}>Industry</th>
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
            {industryRows.map(r => (
              <tr key={r.industry} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                <td className={`${tdClass} text-left font-medium text-white`}>{r.label}</td>
                <td className={`${tdClass} text-slate-300`}>{r.total}</td>
                <td className={`${tdClass} text-purple-400 font-semibold`}>{r.booked}</td>
                <td className={`${tdClass} font-medium`}>{renderPct(r.bookingPct, bookColor)}</td>
                <td className={`${tdClass} text-green-400 font-semibold`}>{r.showed}</td>
                <td className={`${tdClass} font-medium`}>{renderPct(r.showPct, showColor)}</td>
                <td className={`${tdClass} text-amber-400 font-semibold`}>{r.closed}</td>
                <td className={`${tdClass} font-medium`}>{renderPct(r.closePct, closeColor)}</td>
                <td className={`${tdClass} text-green-300`}>{fmt(r.totalRevenue)}</td>
                <td className={`${tdClass} text-sky-400`}>{r.avgRevPerBooking != null ? fmt(Math.round(r.avgRevPerBooking)) : <span className="text-slate-500">—</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600/40 bg-slate-700/20">
              <td className={`${tdClass} text-left font-bold text-white`}>{totalsRow.label}</td>
              <td className={`${tdClass} font-bold text-white`}>{totalsRow.total}</td>
              <td className={`${tdClass} font-bold text-purple-400`}>{totalsRow.booked}</td>
              <td className={`${tdClass} font-bold`}>{renderPct(totalsRow.bookingPct, bookColor)}</td>
              <td className={`${tdClass} font-bold text-green-400`}>{totalsRow.showed}</td>
              <td className={`${tdClass} font-bold`}>{renderPct(totalsRow.showPct, showColor)}</td>
              <td className={`${tdClass} font-bold text-amber-400`}>{totalsRow.closed}</td>
              <td className={`${tdClass} font-bold`}>{renderPct(totalsRow.closePct, closeColor)}</td>
              <td className={`${tdClass} font-bold text-green-300`}>{fmt(totalsRow.totalRevenue)}</td>
              <td className={`${tdClass} font-bold text-sky-400`}>{totalsRow.avgRevPerBooking != null ? fmt(Math.round(totalsRow.avgRevPerBooking)) : <span className="text-slate-500">—</span>}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}