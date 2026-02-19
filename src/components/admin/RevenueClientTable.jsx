import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FlipMove from 'react-flip-move';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-500/15 text-blue-400', pay_per_set: 'bg-purple-500/15 text-purple-400', retainer: 'bg-amber-500/15 text-amber-400' };

export default function RevenueClientTable({ clients, clientSummary = [] }) {
  const rows = clientSummary.sort((a, b) => b.ltv - a.ltv);

  const totals = rows.reduce((acc, r) => ({
    ltv: acc.ltv + r.ltv,
    outstanding: acc.outstanding + r.outstanding,
  }), { ltv: 0, outstanding: 0 });

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-white">Client Revenue</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-left">Billing</th>
              <th className="px-3 py-2 text-right">Lifetime Value</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <FlipMove typeName="tbody" duration={400} easing="cubic-bezier(0.25, 0.46, 0.45, 0.94)" staggerDurationBy={20} enterAnimation="fade" leaveAnimation="fade" className="divide-y divide-slate-700/30">
            {rows.map(r => (
              <RevenueRow key={r.id} r={r} BILLING_LABELS={BILLING_LABELS} BILLING_COLORS={BILLING_COLORS} />
            ))}
          </FlipMove>
          <tfoot className="bg-slate-900/50 font-bold text-xs text-slate-300">
            <tr>
              <td className="px-4 py-2">TOTALS</td>
              <td></td>
              <td className="px-3 py-2 text-right text-emerald-400">${totals.ltv.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-amber-400">{totals.outstanding > 0 ? `$${totals.outstanding.toLocaleString()}` : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const RevenueRow = forwardRef(({ r, BILLING_LABELS, BILLING_COLORS }, ref) => (
  <tr ref={ref} className="hover:bg-slate-700/20">
    <td className="px-4 py-2.5">
      <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-400 hover:text-blue-300">{r.name}</Link>
    </td>
    <td className="px-3 py-2.5">
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type] || 'bg-slate-700 text-slate-400'}`}>
        {BILLING_LABELS[r.billing_type] || r.billing_type}
      </span>
    </td>
    <td className="px-3 py-2.5 text-right font-medium text-emerald-400">${r.ltv.toLocaleString()}</td>
    <td className="px-3 py-2.5 text-right font-medium text-amber-400">{r.outstanding > 0 ? `$${r.outstanding.toLocaleString()}` : '—'}</td>
  </tr>
));