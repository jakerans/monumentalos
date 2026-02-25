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

export default function LeadChannelByIndustry({ leads, inRange }) {
  const rows = useMemo(() => {
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

    const industryRows = Object.entries(groups).map(([industry, indLeads]) => {
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

    return industryRows;
  }, [leads, inRange]);

  const thClass = "text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2.5 text-right whitespace-nowrap";
  const tdClass = "px-3 py-3 text-sm text-right";

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
            {rows.map(r => (
              <tr key={r.industry} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
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
        </table>
      </div>
    </div>
  );
}