import React from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DollarSign, TrendingUp, TrendingDown, ArrowDownRight, Percent, BarChart3 } from 'lucide-react';

dayjs.extend(isBetween);

export default function AccountingKPIs({ clients, leads, payments, expenses, startDate, endDate }) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const inRange = (d) => d ? dayjs(d).isBetween(start, end, null, '[]') : false;

  let grossRevenue = 0;
  clients.filter(c => c.status === 'active').forEach(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);
    if (bt === 'pay_per_show') {
      grossRevenue += cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
    } else if (bt === 'pay_per_set') {
      grossRevenue += cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
    } else if (bt === 'retainer') {
      const months = Math.max(1, Math.ceil(end.diff(start, 'day') / 30));
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
    { label: 'Gross Revenue', value: `$${grossRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Cash Collected', value: `$${collected.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: ArrowDownRight, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'COGS', value: `$${cogs.toLocaleString()}`, icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Overhead', value: `$${overhead.toLocaleString()}`, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Gross Profit', value: `$${grossProfit.toLocaleString()}`, icon: BarChart3, color: grossProfit >= 0 ? 'text-green-400' : 'text-red-400', bg: grossProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
    { label: 'Gross Margin', value: `${grossMargin}%`, icon: Percent, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, icon: DollarSign, color: netProfit >= 0 ? 'text-green-400' : 'text-red-400', bg: netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
    { label: 'Net Margin', value: `${netMargin}%`, icon: Percent, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-tight">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}><c.icon className={`w-3 h-3 ${c.color}`} /></div>
          </div>
          <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}