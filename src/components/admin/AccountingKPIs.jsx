import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowDownRight, Percent, BarChart3 } from 'lucide-react';

export default function AccountingKPIs({ clients, leads, payments, expenses, startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');
  const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= start && dt <= end; };

  let grossRevenue = 0;
  clients.filter(c => c.status === 'active').forEach(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);
    if (bt === 'pay_per_show') {
      grossRevenue += cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
    } else if (bt === 'pay_per_set') {
      grossRevenue += cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
    } else if (bt === 'retainer') {
      const months = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
      grossRevenue += (client.retainer_amount || 0) * months;
    }
  });

  const collected = payments.filter(p => inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
  const rangeExpenses = expenses.filter(e => inRange(e.date));
  const cogs = rangeExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const overhead = rangeExpenses.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenses = cogs + overhead;
  const grossProfit = grossRevenue - cogs;
  const netProfit = collected - totalExpenses;
  const grossMargin = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0.0';
  const netMargin = collected > 0 ? ((netProfit / collected) * 100).toFixed(1) : '0.0';
  const outstanding = grossRevenue - collected;

  const cards = [
    { label: 'Gross Revenue', value: `$${grossRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cash Collected', value: `$${collected.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'COGS', value: `$${cogs.toLocaleString()}`, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Overhead', value: `$${overhead.toLocaleString()}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Gross Profit', value: `$${grossProfit.toLocaleString()}`, icon: BarChart3, color: grossProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: grossProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Gross Margin', value: `${grossMargin}%`, icon: Percent, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, icon: DollarSign, color: netProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Net Margin', value: `${netMargin}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider leading-tight">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}><c.icon className={`w-3 h-3 ${c.color}`} /></div>
          </div>
          <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}