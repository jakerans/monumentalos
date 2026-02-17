import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-500/15 text-blue-400', pay_per_set: 'bg-purple-500/15 text-purple-400', retainer: 'bg-amber-500/15 text-amber-400' };

function calcRevenue(client, leads, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');
  const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= start && dt <= end; };
  const bt = client.billing_type || 'pay_per_show';
  const cLeads = leads.filter(l => l.client_id === client.id);

  if (bt === 'pay_per_show') return cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
  if (bt === 'pay_per_set') return cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
  if (bt === 'retainer') return client.retainer_amount || 0;
  return 0;
}

export default function RevenueClientTable({ clients, leads, payments }) {
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const rows = clients.filter(c => c.status === 'active').map(client => {
    const bt = client.billing_type || 'pay_per_show';
    const revLastMonth = calcRevenue(client, leads, lastMonthStart, lastMonthEnd);

    // LTV = all-time collected payments
    const ltv = payments.filter(p => p.client_id === client.id).reduce((s, p) => s + (p.amount || 0), 0);

    // Outstanding = all-time billed minus all-time collected
    const cLeads = leads.filter(l => l.client_id === client.id);
    let allTimeBilled = 0;
    if (bt === 'pay_per_show') allTimeBilled = cLeads.filter(l => l.disposition === 'showed').length * (client.price_per_shown_appointment || 0);
    else if (bt === 'pay_per_set') allTimeBilled = cLeads.filter(l => l.date_appointment_set).length * (client.price_per_set_appointment || 0);
    else if (bt === 'retainer') {
      // Estimate months active from earliest payment or lead
      const dates = [...payments.filter(p => p.client_id === client.id).map(p => p.date), ...cLeads.map(l => l.created_date)].filter(Boolean).sort();
      if (dates.length > 0) {
        const first = new Date(dates[0]);
        const months = Math.max(1, Math.ceil((now - first) / (30 * 24 * 60 * 60 * 1000)));
        allTimeBilled = (client.retainer_amount || 0) * months;
      }
    }
    const outstanding = Math.max(0, allTimeBilled - ltv);

    return { ...client, bt, revLastMonth, ltv, outstanding };
  }).sort((a, b) => b.ltv - a.ltv);

  const totals = rows.reduce((acc, r) => ({
    revLastMonth: acc.revLastMonth + r.revLastMonth,
    ltv: acc.ltv + r.ltv,
    outstanding: acc.outstanding + r.outstanding,
  }), { revLastMonth: 0, ltv: 0, outstanding: 0 });

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
              <th className="px-3 py-2 text-right">Rev Last Month</th>
              <th className="px-3 py-2 text-right">Lifetime Value</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-slate-700/20">
                <td className="px-4 py-2.5">
                  <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-400 hover:text-blue-300">{r.name}</Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.bt] || 'bg-slate-700 text-slate-400'}`}>
                    {BILLING_LABELS[r.bt] || r.bt}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-white">${r.revLastMonth.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-medium text-emerald-400">${r.ltv.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-medium text-amber-400">{r.outstanding > 0 ? `$${r.outstanding.toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900/50 font-bold text-xs text-slate-300">
            <tr>
              <td className="px-4 py-2">TOTALS</td>
              <td></td>
              <td className="px-3 py-2 text-right">${totals.revLastMonth.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-emerald-400">${totals.ltv.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-amber-400">{totals.outstanding > 0 ? `$${totals.outstanding.toLocaleString()}` : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}