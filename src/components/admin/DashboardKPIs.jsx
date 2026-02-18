import React, { useMemo } from 'react';
import { Users, DollarSign, Calendar, TrendingUp, Phone, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

function buildDailySparkline(items, dateKey, days = 14) {
  const now = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    data.push({ v: items.filter(item => item[dateKey]?.startsWith(dayStr)).length });
  }
  return data;
}

function pct(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prior) / prior) * 100);
}

export default function DashboardKPIs({ clients, leads, spend, payments }) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const inLM = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lmStart && dt <= lmEnd; };

  const thisMonthLeads = leads.filter(l => new Date(l.created_date) >= thisMonthStart);
  const thisMonthBooked = leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart);
  const thisMonthShowed = leads.filter(l => l.disposition === 'showed' && l.appointment_date && new Date(l.appointment_date) >= thisMonthStart);
  const thisMonthSpend = spend.filter(s => new Date(s.date) >= thisMonthStart).reduce((sum, s) => sum + (s.amount || 0), 0);
  const thisMonthPayments = payments.filter(p => new Date(p.date) >= thisMonthStart).reduce((sum, p) => sum + (p.amount || 0), 0);

  const lmLeads = leads.filter(l => inLM(l.created_date)).length;
  const lmBooked = leads.filter(l => l.date_appointment_set && inLM(l.date_appointment_set)).length;
  const lmShowed = leads.filter(l => l.disposition === 'showed' && l.appointment_date && inLM(l.appointment_date)).length;
  const lmSpend = spend.filter(s => inLM(s.date)).reduce((sum, s) => sum + (s.amount || 0), 0);
  const lmPayments = payments.filter(p => inLM(p.date)).reduce((sum, p) => sum + (p.amount || 0), 0);

  const avgSTL = (() => {
    const withSTL = thisMonthLeads.filter(l => l.speed_to_lead_minutes != null);
    if (!withSTL.length) return null;
    return Math.round(withSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / withSTL.length);
  })();
  const lmSTL = (() => {
    const withSTL = leads.filter(l => inLM(l.created_date) && l.speed_to_lead_minutes != null);
    if (!withSTL.length) return null;
    return Math.round(withSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / withSTL.length);
  })();

  const leadsSpk = useMemo(() => buildDailySparkline(leads, 'created_date'), [leads]);
  const bookedSpk = useMemo(() => buildDailySparkline(leads.filter(l => l.date_appointment_set), 'date_appointment_set'), [leads]);

  const cards = [
    { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    { label: 'Leads This Month', value: thisMonthLeads.length, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8', sparkData: leadsSpk, comp: { prior: lmLeads, change: pct(thisMonthLeads.length, lmLeads) } },
    { label: 'Appts Booked (MTD)', value: thisMonthBooked.length, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc', sparkData: bookedSpk, comp: { prior: lmBooked, change: pct(thisMonthBooked.length, lmBooked) } },
    { label: 'Appts Showed (MTD)', value: thisMonthShowed.length, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399', comp: { prior: lmShowed, change: pct(thisMonthShowed.length, lmShowed) } },
    { label: 'Ad Spend (MTD)', value: `$${thisMonthSpend.toLocaleString()}`, icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10', spark: '#f87171', comp: { prior: `$${lmSpend.toLocaleString()}`, change: pct(thisMonthSpend, lmSpend), invertColor: true } },
    { label: 'Revenue Collected (MTD)', value: `$${thisMonthPayments.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', spark: '#34d399', comp: { prior: `$${lmPayments.toLocaleString()}`, change: pct(thisMonthPayments, lmPayments) } },
    { label: 'Avg Speed-to-Lead', value: avgSTL != null ? `${avgSTL} min` : '—', icon: Phone, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24', comp: avgSTL != null && lmSTL != null ? { prior: `${lmSTL} min`, change: pct(avgSTL, lmSTL), invertColor: true } : null },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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