import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ClientPerfCharts({ clients, leads, spend }) {
  const active = clients.filter(c => c.status === 'active');

  const clientBars = useMemo(() => {
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return active.map(client => {
      const cLeads = leads.filter(l => l.client_id === client.id && new Date(l.created_date) >= mtdStart);
      const booked = leads.filter(l => l.client_id === client.id && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
      const showed = leads.filter(l => l.client_id === client.id && (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost') && l.appointment_date && new Date(l.appointment_date) >= mtdStart).length;
      const adSpend = spend.filter(s => s.client_id === client.id && new Date(s.date) >= mtdStart).reduce((s, r) => s + (r.amount || 0), 0);
      return { name: client.name?.substring(0, 12) || '?', leads: cLeads.length, booked, showed, adSpend: Math.round(adSpend) };
    }).sort((a, b) => b.booked - a.booked);
  }, [active, leads, spend]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">MTD Appointments by Client</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={clientBars}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="booked" fill="#8b5cf6" name="Booked" radius={[2, 2, 0, 0]} />
            <Bar dataKey="showed" fill="#10b981" name="Showed" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">MTD Ad Spend by Client</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={clientBars}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
            <Bar dataKey="adSpend" fill="#ef4444" name="Ad Spend" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}