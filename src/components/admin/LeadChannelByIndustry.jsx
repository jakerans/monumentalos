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
const pctVal = (num, den) => den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : null;

const bookColor = (v) => v == null ? 'text-slate-500' : v >= 40 ? 'text-green-400' : v >= 20 ? 'text-amber-400' : 'text-red-400';
const showColor = (v) => v == null ? 'text-slate-500' : v >= 70 ? 'text-green-400' : v >= 50 ? 'text-amber-400' : 'text-red-400';
const closeColor = (v) => v == null ? 'text-slate-500' : v >= 30 ? 'text-green-400' : v >= 15 ? 'text-amber-400' : 'text-red-400';
const fmtPct = (v) => v != null ? `${v}%` : '—';

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
      return {
        industry,
        label: INDUSTRY_LABELS[industry] || industry.charAt(0).toUpperCase() + industry.slice(1),
        total, booked, showed, closed, totalRevenue,
        avgRevPerBooking: booked > 0 ? totalRevenue / booked : null,
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
        industry: '_total', label: 'All Industries',
        total: allTotal, booked: allBooked, showed: allShowed, closed: allClosed,
        totalRevenue: allRevenue, avgRevPerBooking: allBooked > 0 ? allRevenue / allBooked : null,
      },
    };
  }, [leads, inRange]);

  const thClass = "text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2.5 text-right whitespace-nowrap";
  const tdClass = "px-3 py-3 text-sm text-right";

  const renderRow = (r, isBold) => {
    const bPct = pctVal(r.booked, r.total);
    const sPct = pctVal(r.showed, r.booked);
    const cPct = pctVal(r.closed, r.booked);
    const fw = isBold ? 'font-bold' : 'font-medium';
    const nameCls = isBold ? 'font-bold text-white' : 'font-medium text-white';

    return (
      <tr key={r.industry} className={isBold ? 'border-t border-slate-600/40 bg-slate-800/60' : 'border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors'}>
        <td className={`${tdClass} text-left ${nameCls}`}>{r.label}</td>
        <td className={`${tdClass} text-slate-300 ${fw}`}>{r.total}</td>
        <td className={`${tdClass} text-purple-400 ${fw}`}>{r.booked}</td>
        <td className={`${tdClass} ${fw} ${bookColor(bPct)}`}>{fmtPct(bPct)}</td>
        <td className={`${tdClass} text-green-400 ${fw}`}>{r.showed}</td>
        <td className={`${tdClass} ${fw} ${showColor(sPct)}`}>{fmtPct(sPct)}</td>
        <td className={`${tdClass} text-amber-400 ${fw}`}>{r.closed}</td>
        <td className={`${tdClass} ${fw} ${closeColor(cPct)}`}>{fmtPct(cPct)}</td>
        <td className={`${tdClass} text-green-300 ${fw}`}>{fmt(r.totalRevenue)}</td>
        <td className={`${tdClass} text-sky-400 ${fw}`}>{r.avgRevPerBooking != null ? fmt(Math.round(r.avgRevPerBooking)) : '—'}</td>
      </tr>
    );
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
            {industryRows.map(r => renderRow(r, false))}
          </tbody>
          <tfoot>
            {renderRow(totalsRow, true)}
          </tfoot>
        </table>
      </div>
    </div>
  );
}