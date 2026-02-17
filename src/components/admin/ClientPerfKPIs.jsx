import React, { useMemo } from 'react';
import { Users, CalendarCheck, Target, TrendingUp, Phone, BarChart3 } from 'lucide-react';
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

export default function ClientPerfKPIs({ clients, leads, spend }) {
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const active = clients.filter(c => c.status === 'active');
  const mtdLeads = leads.filter(l => new Date(l.created_date) >= mtdStart);
  const mtdBooked = leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart);
  const mtdShowed = leads.filter(l => (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost') && l.appointment_date && new Date(l.appointment_date) >= mtdStart);
  const mtdSpend = spend.filter(s => new Date(s.date) >= mtdStart).reduce((s, r) => s + (r.amount || 0), 0);
  const avgCPA = mtdBooked.length > 0 ? mtdSpend / mtdBooked.length : 0;
  const showRate = mtdBooked.length > 0 ? ((mtdShowed.length / mtdBooked.length) * 100).toFixed(0) : '0';
  const stlLeads = mtdLeads.filter(l => l.speed_to_lead_minutes != null);
  const avgSTL = stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;

  const leadsSpk = useMemo(() => buildDailySparkline(leads, 'created_date'), [leads]);
  const bookedSpk = useMemo(() => buildDailySparkline(leads.filter(l => l.date_appointment_set), 'date_appointment_set'), [leads]);

  const cards = [
    { label: 'Active Clients', value: active.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    { label: 'MTD Leads', value: mtdLeads.length, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', spark: '#818cf8', sparkData: leadsSpk },
    { label: 'MTD Booked', value: mtdBooked.length, icon: CalendarCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', spark: '#c084fc', sparkData: bookedSpk },
    { label: 'MTD Showed', value: mtdShowed.length, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', spark: '#34d399' },
    { label: 'Avg CPA', value: avgCPA > 0 ? `$${avgCPA.toFixed(0)}` : '—', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10', spark: '#fbbf24' },
    { label: 'Show Rate', value: `${showRate}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', spark: '#34d399' },
    { label: 'Avg STL', value: avgSTL != null ? `${avgSTL}m` : '—', icon: Phone, color: 'text-cyan-400', bg: 'bg-cyan-500/10', spark: '#22d3ee' },
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
        />
      ))}
    </div>
  );
}