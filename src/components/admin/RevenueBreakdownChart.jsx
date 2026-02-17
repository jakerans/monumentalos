import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign } from 'lucide-react';

const BILLING_CONFIG = [
  { key: 'pay_per_show', label: 'Pay Per Show', color: '#3b82f6' },
  { key: 'pay_per_set', label: 'Pay Per Set', color: '#8b5cf6' },
  { key: 'retainer', label: 'Retainer', color: '#f59e0b' },
];

export default function RevenueBreakdownChart({ clients, leads, spend }) {
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inMTD = (d) => d && new Date(d) >= mtdStart;

  const breakdown = BILLING_CONFIG.map(bt => {
    let revenue = 0;
    const btClients = clients.filter(c => c.status === 'active' && (c.billing_type || 'pay_per_show') === bt.key);

    btClients.forEach(client => {
      const cLeads = leads.filter(l => l.client_id === client.id);
      if (bt.key === 'pay_per_show') {
        revenue += cLeads.filter(l => l.disposition === 'showed' && inMTD(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
      } else if (bt.key === 'pay_per_set') {
        revenue += cLeads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
      } else if (bt.key === 'retainer') {
        revenue += (client.retainer_amount || 0);
      }
    });

    return { name: bt.label, value: revenue, color: bt.color, count: btClients.length };
  }).filter(d => d.value > 0 || d.count > 0);

  const totalRevenue = breakdown.reduce((s, b) => s + b.value, 0);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-white">Revenue by Billing Type (MTD)</h3>
      </div>

      {totalRevenue === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No revenue data yet this month</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">${totalRevenue.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400">total</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {breakdown.map(d => {
              const pct = totalRevenue > 0 ? ((d.value / totalRevenue) * 100).toFixed(0) : 0;
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-300">{d.name}</span>
                      <span className="text-[10px] text-slate-500">({d.count} clients)</span>
                    </div>
                    <span className="text-xs font-bold text-white">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}