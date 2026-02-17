import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-100 text-blue-700', pay_per_set: 'bg-purple-100 text-purple-700', retainer: 'bg-amber-100 text-amber-700' };

export default function RevenueClientTable({ clients, leads, payments, startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');
  const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= start && dt <= end; };

  const rows = clients.filter(c => c.status === 'active').map(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);
    const booked = cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set));
    const showed = cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date));

    let billed = 0;
    if (bt === 'pay_per_show') billed = showed.length * (client.price_per_shown_appointment || 0);
    else if (bt === 'pay_per_set') billed = booked.length * (client.price_per_set_appointment || 0);
    else if (bt === 'retainer') {
      const months = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
      billed = (client.retainer_amount || 0) * months;
    }

    const collected = payments.filter(p => p.client_id === client.id && inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
    const outstanding = billed - collected;

    return { ...client, bt, booked: booked.length, showed: showed.length, billed, collected, outstanding };
  });

  const totals = rows.reduce((acc, r) => ({
    booked: acc.booked + r.booked,
    showed: acc.showed + r.showed,
    billed: acc.billed + r.billed,
    collected: acc.collected + r.collected,
    outstanding: acc.outstanding + r.outstanding,
  }), { booked: 0, showed: 0, billed: 0, collected: 0, outstanding: 0 });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900">Client Revenue Breakdown</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-left">Billing</th>
              <th className="px-3 py-2 text-right">Booked</th>
              <th className="px-3 py-2 text-right">Showed</th>
              <th className="px-3 py-2 text-right">To Be Billed</th>
              <th className="px-3 py-2 text-right">Collected</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-600 hover:text-blue-700">{r.name}</Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.bt] || 'bg-gray-100 text-gray-600'}`}>
                    {BILLING_LABELS[r.bt] || r.bt}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">{r.booked}</td>
                <td className="px-3 py-2.5 text-right">{r.showed}</td>
                <td className="px-3 py-2.5 text-right font-medium">${r.billed.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-medium text-emerald-700">${r.collected.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-medium text-amber-700">${r.outstanding.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold text-xs">
            <tr>
              <td className="px-4 py-2">TOTALS</td>
              <td></td>
              <td className="px-3 py-2 text-right">{totals.booked}</td>
              <td className="px-3 py-2 text-right">{totals.showed}</td>
              <td className="px-3 py-2 text-right">${totals.billed.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-emerald-700">${totals.collected.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-amber-700">${totals.outstanding.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}