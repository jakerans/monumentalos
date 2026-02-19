import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DollarSign, TrendingUp, TrendingDown, ArrowDownRight, Percent, BarChart3 } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

dayjs.extend(isBetween);

function buildDailyAmountSparkline(items, dateKey, amountKey = 'amount', days = 14) {
  const now = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    data.push({ v: items.filter(item => item[dateKey]?.startsWith(dayStr)).reduce((s, item) => s + (item[amountKey] || 0), 0) });
  }
  return data;
}

function pct(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : cur < 0 ? -100 : 0;
  return Math.round(((cur - prior) / Math.abs(prior)) * 100);
}

function calcPeriod(clients, leads, payments, expenses, rangeFn) {
  let grossRevenue = 0;
  clients.filter(c => c.status === 'active').forEach(client => {
    const bt = client.billing_type || 'pay_per_show';
    const cLeads = leads.filter(l => l.client_id === client.id);
    if (bt === 'pay_per_show') {
      grossRevenue += cLeads.filter(l => l.disposition === 'showed' && rangeFn(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
    } else if (bt === 'pay_per_set') {
      grossRevenue += cLeads.filter(l => l.date_appointment_set && rangeFn(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
    } else if (bt === 'retainer') {
      grossRevenue += (client.retainer_amount || 0);
    }
  });
  const collected = payments.filter(p => rangeFn(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
  const re = expenses.filter(e => rangeFn(e.date) && e.category !== 'distribution');
  const cogs = re.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const overhead = re.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const grossProfit = grossRevenue - cogs;
  const netProfit = collected - cogs - overhead;
  const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
  const netMargin = collected > 0 ? (netProfit / collected) * 100 : 0;
  return { grossRevenue, collected, outstanding: grossRevenue - collected, cogs, overhead, grossProfit, netProfit, grossMargin, netMargin };
}

export default function AccountingKPIs({ clients, leads, payments, expenses, startDate, endDate }) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const rangeDays = end.diff(start, 'day') + 1;
  const priorEnd = start.subtract(1, 'day').endOf('day');
  const priorStart = start.subtract(rangeDays, 'day').startOf('day');

  const inRange = (d) => d ? dayjs(d).isBetween(start, end, null, '[]') : false;
  const inPrior = (d) => d ? dayjs(d).isBetween(priorStart, priorEnd, null, '[]') : false;

  const cur = useMemo(() => calcPeriod(clients, leads, payments, expenses, inRange), [clients, leads, payments, expenses, startDate, endDate]);
  const pri = useMemo(() => calcPeriod(clients, leads, payments, expenses, inPrior), [clients, leads, payments, expenses, startDate, endDate]);

  const paySpk = useMemo(() => buildDailyAmountSparkline(payments, 'date'), [payments]);
  const expSpk = useMemo(() => buildDailyAmountSparkline(expenses, 'date'), [expenses]);

  const cards = [
    { label: 'Gross Revenue', value: `$${cur.grossRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa', comp: { prior: `$${pri.grossRevenue.toLocaleString()}`, change: pct(cur.grossRevenue, pri.grossRevenue) } },
    { label: 'Cash Collected', value: `$${cur.collected.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', spark: '#34d399', sparkData: paySpk, comp: { prior: `$${pri.collected.toLocaleString()}`, change: pct(cur.collected, pri.collected) } },
    { label: 'Outstanding', value: `$${cur.outstanding.toLocaleString()}`, icon: ArrowDownRight, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24', comp: { prior: `$${pri.outstanding.toLocaleString()}`, change: pct(cur.outstanding, pri.outstanding), invertColor: true } },
    { label: 'COGS', value: `$${cur.cogs.toLocaleString()}`, icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/10', spark: '#fb923c', comp: { prior: `$${pri.cogs.toLocaleString()}`, change: pct(cur.cogs, pri.cogs), invertColor: true } },
    { label: 'Overhead', value: `$${cur.overhead.toLocaleString()}`, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', spark: '#f87171', sparkData: expSpk, comp: { prior: `$${pri.overhead.toLocaleString()}`, change: pct(cur.overhead, pri.overhead), invertColor: true } },
    { label: 'Gross Profit', value: `$${cur.grossProfit.toLocaleString()}`, icon: BarChart3, color: cur.grossProfit >= 0 ? 'text-green-400' : 'text-red-400', bg: cur.grossProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10', spark: cur.grossProfit >= 0 ? '#34d399' : '#f87171', comp: { prior: `$${pri.grossProfit.toLocaleString()}`, change: pct(cur.grossProfit, pri.grossProfit) } },
    { label: 'Gross Margin', value: `${cur.grossMargin.toFixed(1)}%`, icon: Percent, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8', comp: { prior: `${pri.grossMargin.toFixed(1)}%`, change: Math.round(cur.grossMargin - pri.grossMargin) } },
    { label: 'Net Profit', value: `$${cur.netProfit.toLocaleString()}`, icon: DollarSign, color: cur.netProfit >= 0 ? 'text-green-400' : 'text-red-400', bg: cur.netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10', spark: cur.netProfit >= 0 ? '#34d399' : '#f87171', comp: { prior: `$${pri.netProfit.toLocaleString()}`, change: pct(cur.netProfit, pri.netProfit) } },
    { label: 'Net Margin', value: `${cur.netMargin.toFixed(1)}%`, icon: Percent, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc', comp: { prior: `${pri.netMargin.toFixed(1)}%`, change: Math.round(cur.netMargin - pri.netMargin) } },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
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
          sparkData={c.sparkData}
          comparison={c.comp}
        />
      ))}
    </div>
  );
}