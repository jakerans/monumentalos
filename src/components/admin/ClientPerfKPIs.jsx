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
    { label: 'Active Clients', value: active.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'MTD Leads', value: mtdLeads.length, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'MTD Booked', value: mtdBooked.length, icon: CalendarCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'MTD Showed', value: mtdShowed.length, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg CPA', value: avgCPA > 0 ? `$${avgCPA.toFixed(0)}` : '—', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Show Rate', value: `${showRate}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg STL', value: avgSTL != null ? `${avgSTL}m` : '—', icon: Phone, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{c.label}</p>
            <div className={`p-1 rounded ${c.bg}`}><c.icon className={`w-3.5 h-3.5 ${c.color}`} /></div>
          </div>
          <p className="text-xl font-bold text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}