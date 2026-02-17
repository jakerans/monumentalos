import React from 'react';
import { Users, DollarSign, Calendar, TrendingUp, Phone, Target } from 'lucide-react';

export default function DashboardKPIs({ clients, leads, spend, payments }) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthLeads = leads.filter(l => new Date(l.created_date) >= thisMonthStart);
  const thisMonthBooked = leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart);
  const thisMonthShowed = leads.filter(l => l.disposition === 'showed' && l.appointment_date && new Date(l.appointment_date) >= thisMonthStart);

  const thisMonthSpend = spend
    .filter(s => new Date(s.date) >= thisMonthStart)
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const thisMonthPayments = payments
    .filter(p => new Date(p.date) >= thisMonthStart)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const avgSTL = (() => {
    const withSTL = thisMonthLeads.filter(l => l.speed_to_lead_minutes != null);
    if (!withSTL.length) return null;
    return Math.round(withSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / withSTL.length);
  })();

  const cards = [
    { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Leads This Month', value: thisMonthLeads.length, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Appts Booked (MTD)', value: thisMonthBooked.length, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Appts Showed (MTD)', value: thisMonthShowed.length, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Ad Spend (MTD)', value: `$${thisMonthSpend.toLocaleString()}`, icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Revenue Collected (MTD)', value: `$${thisMonthPayments.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg Speed-to-Lead', value: avgSTL != null ? `${avgSTL} min` : '—', icon: Phone, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}