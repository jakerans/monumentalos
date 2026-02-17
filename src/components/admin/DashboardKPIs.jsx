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
    { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Leads This Month', value: thisMonthLeads.length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Appts Booked (MTD)', value: thisMonthBooked.length, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Appts Showed (MTD)', value: thisMonthShowed.length, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ad Spend (MTD)', value: `$${thisMonthSpend.toLocaleString()}`, icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Revenue Collected (MTD)', value: `$${thisMonthPayments.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Speed-to-Lead', value: avgSTL != null ? `${avgSTL} min` : '—', icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}