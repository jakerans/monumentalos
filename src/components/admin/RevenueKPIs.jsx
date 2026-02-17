import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowDownRight } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

export default function RevenueKPIs({ clients, leads, payments, expenses, startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');
  const inRange = (dateStr) => { if (!dateStr) return false; const d = new Date(dateStr); return d >= start && d <= end; };

  let totalBilled = 0;
  clients.filter(c => c.status === 'active').forEach(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);
    if (bt === 'pay_per_show') {
      totalBilled += cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
    } else if (bt === 'pay_per_set') {
      totalBilled += cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
    } else if (bt === 'retainer') {
      const monthsInRange = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
      totalBilled += (client.retainer_amount || 0) * monthsInRange;
    }
  });

  const totalCollected = payments.filter(p => inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.filter(e => inRange(e.date)).reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalCollected - totalExpenses;
  const outstanding = totalBilled - totalCollected;

  const cards = [
    { label: 'To Be Billed', value: `$${totalBilled.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    { label: 'Collected', value: `$${totalCollected.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', spark: '#34d399' },
    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: ArrowDownRight, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24' },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', spark: '#f87171' },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, icon: DollarSign, color: netProfit >= 0 ? 'text-green-400' : 'text-red-400', bg: netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10', spark: netProfit >= 0 ? '#34d399' : '#f87171' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <SparklineCard
          key={c.label}
          index={i}
          label={c.label}
          value={c.value}
          icon={c.icon}
          iconBg={c.bg}
          iconColor={c.color}
          sparkColor={c.spark}
        />
      ))}
    </div>
  );
}