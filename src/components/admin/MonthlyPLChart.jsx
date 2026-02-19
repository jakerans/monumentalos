import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart } from 'recharts';

export default function MonthlyPLChart({ clients, leads, payments, expenses }) {
  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      });
    }

    return months.map(m => {
      const mStart = new Date(m.year, m.month, 1);
      const mEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59);
      const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= mStart && dt <= mEnd; };

      let grossRevenue = 0;
      clients.filter(c => c.status === 'active').forEach(client => {
        const bt = client.billing_type || 'pay_per_show';
        const cLeads = leads.filter(l => l.client_id === client.id);
        if (bt === 'pay_per_show') {
          grossRevenue += cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
        } else if (bt === 'pay_per_set') {
          grossRevenue += cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
        } else if (bt === 'retainer') {
          grossRevenue += (client.retainer_amount || 0);
        }
      });

      const collected = payments.filter(p => inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
      const mExpenses = expenses.filter(e => inRange(e.date));
      const cogs = mExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const overhead = mExpenses.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const grossProfit = grossRevenue - cogs;
      const netProfit = collected - cogs - overhead;

      return { name: m.label, Revenue: Math.round(grossRevenue), Collected: Math.round(collected), COGS: Math.round(cogs), Overhead: Math.round(overhead), 'Gross Profit': Math.round(grossProfit), 'Net Profit': Math.round(netProfit) };
    });
  }, [clients, leads, payments, expenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <h3 className="text-sm font-bold text-white mb-3">Revenue & Collections (6 Months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={v => `$${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Collected" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <h3 className="text-sm font-bold text-white mb-3">Profit & Expenses (6 Months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={v => `$${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="COGS" stackId="expenses" fill="#f97316" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Overhead" stackId="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="Gross Profit" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Net Profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}