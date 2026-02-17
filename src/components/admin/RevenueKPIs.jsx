import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowDownRight } from 'lucide-react';

export default function RevenueKPIs({ clients, leads, payments, expenses, startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  // Revenue calculation based on billing type
  let totalBilled = 0;
  clients.filter(c => c.status === 'active').forEach(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);

    if (bt === 'pay_per_show') {
      const showed = cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date));
      totalBilled += showed.length * (client.price_per_shown_appointment || 0);
    } else if (bt === 'pay_per_set') {
      const booked = cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set));
      totalBilled += booked.length * (client.price_per_set_appointment || 0);
    } else if (bt === 'retainer') {
      // For retainer: count months in range
      const monthsInRange = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
      totalBilled += (client.retainer_amount || 0) * monthsInRange;
    }
  });

  const totalCollected = payments
    .filter(p => inRange(p.date))
    .reduce((s, p) => s + (p.amount || 0), 0);

  const totalExpenses = expenses
    .filter(e => inRange(e.date))
    .reduce((s, e) => s + (e.amount || 0), 0);

  const netProfit = totalCollected - totalExpenses;
  const outstanding = totalBilled - totalCollected;

  const cards = [
    { label: 'To Be Billed', value: `$${totalBilled.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Collected', value: `$${totalCollected.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, icon: DollarSign, color: netProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}