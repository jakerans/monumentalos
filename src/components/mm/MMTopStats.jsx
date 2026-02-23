import React, { useMemo } from 'react';
import { Users, CalendarCheck, DollarSign, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';
import dayjs from 'dayjs';

function buildDailySparkline(items, dateField, startDate, endDate, valueField) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = end.diff(start, 'day') + 1;
  const buckets = {};
  for (let i = 0; i < days; i++) {
    buckets[start.add(i, 'day').format('YYYY-MM-DD')] = 0;
  }
  items.forEach(item => {
    const d = (item[dateField] || '').slice(0, 10);
    if (d in buckets) {
      buckets[d] += valueField ? (item[valueField] || 0) : 1;
    }
  });
  return Object.values(buckets).map(v => ({ v }));
}

function pctChange(cur, prior) {
  if (!prior || prior === 0) return null;
  return ((cur - prior) / prior) * 100;
}

export default function MMTopStats({ stats, allLeads = [], allSpend = [], periodRange }) {
  const pd = stats.periodLabel || '30d';
  const cpaDisplay = stats.avgCPA === Infinity || isNaN(stats.avgCPA) || stats.avgCPA === 0 ? '—' : `$${stats.avgCPA.toFixed(0)}`;

  const hasPeriod = !!periodRange;
  const pStart = hasPeriod ? periodRange.periodStart : null;
  const pEnd = hasPeriod ? periodRange.periodEnd : null;
  const prStart = hasPeriod ? periodRange.priorStart : null;
  const prEnd = hasPeriod ? periodRange.priorEnd : null;

  const sparklines = useMemo(() => {
    if (!hasPeriod) return {};
    const pStartStr = pStart.toISOString();
    const pEndStr = pEnd.toISOString();
    const pStartDate = pStartStr.split('T')[0];
    const pEndDate = pEndStr.split('T')[0];
    const prStartStr = prStart.toISOString();
    const prStartDate = prStartStr.split('T')[0];

    const curLeads = allLeads.filter(l => l.created_date >= pStartStr && l.created_date <= pEndStr);
    const priorLeads = allLeads.filter(l => l.created_date >= prStartStr && l.created_date < pStartStr);

    const curApptLeads = allLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= pStartStr && l.date_appointment_set <= pEndStr);
    const priorApptLeads = allLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= prStartStr && l.date_appointment_set < pStartStr);

    const curSpendItems = allSpend.filter(s => s.date >= pStartDate && s.date <= pEndDate);
    const priorSpendItems = allSpend.filter(s => s.date >= prStartDate && s.date < pStartDate);
    const priorSpendTotal = priorSpendItems.reduce((s, r) => s + (r.amount || 0), 0);

    return {
      apptsSpark: buildDailySparkline(curApptLeads, 'date_appointment_set', pStart, pEnd),
      priorAppts: priorApptLeads.length,
      spendSpark: buildDailySparkline(curSpendItems, 'date', pStart, pEnd, 'amount'),
      priorSpend: priorSpendTotal,
    };
  }, [hasPeriod, allLeads, allSpend, pStart, pEnd, prStart]);

  const priorCPA = sparklines.priorAppts > 0 ? sparklines.priorSpend / sparklines.priorAppts : 0;
  const apptsChange = pctChange(stats.apptsSet, sparklines.priorAppts);
  const spendChange = pctChange(stats.spend, sparklines.priorSpend);
  const cpaChange = stats.avgCPA > 0 && priorCPA > 0 ? pctChange(stats.avgCPA, priorCPA) : null;

  const items = [
    { label: 'Active Clients', value: stats.activeClients, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    {
      label: `Appts Set (${pd})`, value: stats.apptsSet, icon: CalendarCheck, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399',
      sparkData: sparklines.apptsSpark,
      comparison: sparklines.priorAppts != null ? { prior: sparklines.priorAppts, change: Math.round(apptsChange || 0) } : null,
    },
    {
      label: `Ad Spend (${pd})`, value: `$${stats.spend.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc',
      sparkData: sparklines.spendSpark,
      comparison: sparklines.priorSpend != null ? { prior: `$${Math.round(sparklines.priorSpend).toLocaleString()}`, change: Math.round(spendChange || 0), invertColor: true } : null,
    },
    {
      label: `Avg CPA (${pd})`, value: cpaDisplay, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8',
      comparison: cpaChange != null ? { prior: `$${Math.round(priorCPA)}`, change: Math.round(cpaChange), invertColor: true } : null,
    },
    {
      label: 'Target Hit Rate', value: stats.targetHitRate === null ? '—' : `${stats.targetHitRate}%`, icon: Target, color: stats.targetHitRate >= 70 ? 'text-green-400' : stats.targetHitRate >= 40 ? 'text-amber-400' : 'text-red-400', bg: stats.targetHitRate >= 70 ? 'bg-green-500/10' : stats.targetHitRate >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10',
      subtitle: stats.clientsWithGoals > 0 ? `${stats.wontHitCount} of ${stats.clientsWithGoals} won't hit` : 'No goals set',
    },
    { label: 'Alerts', value: stats.alertCount, icon: AlertTriangle, color: stats.alertCount > 0 ? 'text-red-400' : 'text-slate-500', bg: stats.alertCount > 0 ? 'bg-red-500/10' : 'bg-slate-800', spark: '#f87171' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {items.map((item, i) => (
        <SparklineCard
          key={item.label}
          index={i}
          label={item.label}
          value={item.value}
          icon={item.icon}
          iconBg={item.bg}
          iconColor={item.color}
          sparkColor={item.spark}
          sparkData={item.sparkData || []}
          comparison={item.comparison}
        />
      ))}
    </div>
  );
}