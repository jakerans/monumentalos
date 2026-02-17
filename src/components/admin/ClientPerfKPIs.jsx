import React from 'react';
import { Users, CalendarCheck, Target, TrendingUp, Phone, BarChart3 } from 'lucide-react';

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

  const cards = [
    { label: 'Active Clients', value: active.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'MTD Leads', value: mtdLeads.length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'MTD Booked', value: mtdBooked.length, icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'MTD Showed', value: mtdShowed.length, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Avg CPA', value: avgCPA > 0 ? `$${avgCPA.toFixed(0)}` : '—', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Show Rate', value: `${showRate}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg STL', value: avgSTL != null ? `${avgSTL}m` : '—', icon: Phone, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}><c.icon className={`w-3.5 h-3.5 ${c.color}`} /></div>
          </div>
          <p className="text-xl font-bold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}