import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const BILLING_LABELS = {
  pay_per_show: 'Per Show',
  pay_per_set: 'Per Set',
  retainer: 'Retainer',
};

const BILLING_COLORS = {
  pay_per_show: 'bg-blue-100 text-blue-700',
  pay_per_set: 'bg-purple-100 text-purple-700',
  retainer: 'bg-amber-100 text-amber-700',
};

function getBillingRate(client) {
  const t = client.billing_type || 'pay_per_show';
  if (t === 'pay_per_set') return client.price_per_set_appointment ? `$${client.price_per_set_appointment}` : '—';
  if (t === 'retainer') return client.retainer_amount ? `$${client.retainer_amount}/mo` : '—';
  return client.price_per_shown_appointment ? `$${client.price_per_shown_appointment}` : '—';
}

export default function ClientOverviewTable({ clients, leads, spend, payments }) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = clients.filter(c => c.status === 'active').map(client => {
    const cLeads = leads.filter(l => l.client_id === client.id);
    const mtdLeads = cLeads.filter(l => new Date(l.created_date) >= thisMonthStart);
    const mtdBooked = cLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart);
    const mtdShowed = cLeads.filter(l => l.disposition === 'showed' && l.appointment_date && new Date(l.appointment_date) >= thisMonthStart);

    const mtdSpend = spend
      .filter(s => s.client_id === client.id && new Date(s.date) >= thisMonthStart)
      .reduce((s, r) => s + (r.amount || 0), 0);

    const billingType = client.billing_type || 'pay_per_show';
    let mtdBilled = 0;
    if (billingType === 'pay_per_show') mtdBilled = mtdShowed.length * (client.price_per_shown_appointment || 0);
    else if (billingType === 'pay_per_set') mtdBilled = mtdBooked.length * (client.price_per_set_appointment || 0);
    else if (billingType === 'retainer') mtdBilled = client.retainer_amount || 0;

    const mtdPaid = payments
      .filter(p => p.client_id === client.id && new Date(p.date) >= thisMonthStart)
      .reduce((s, p) => s + (p.amount || 0), 0);

    return { ...client, mtdLeads: mtdLeads.length, mtdBooked: mtdBooked.length, mtdShowed: mtdShowed.length, mtdSpend, mtdBilled, mtdPaid, billingType };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Client Overview (MTD)</h2>
        <Link
          to={createPageUrl('ClientManagement')}
          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Client
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-left">Billing</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Leads</th>
              <th className="px-3 py-2 text-right">Booked</th>
              <th className="px-3 py-2 text-right">Showed</th>
              <th className="px-3 py-2 text-right">Ad Spend</th>
              <th className="px-3 py-2 text-right">To Be Billed</th>
              <th className="px-3 py-2 text-right">Collected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No active clients</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {r.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billingType] || 'bg-gray-100 text-gray-600'}`}>
                    {BILLING_LABELS[r.billingType] || r.billingType}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">{getBillingRate(r)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{r.mtdLeads}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{r.mtdBooked}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{r.mtdShowed}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">${r.mtdSpend.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-medium text-green-700">${r.mtdBilled.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-medium text-emerald-700">${r.mtdPaid.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}