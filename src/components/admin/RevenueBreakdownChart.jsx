import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const BILLING_CONFIG = [
  { key: 'pay_per_show', label: 'Pay Per Show', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { key: 'pay_per_set', label: 'Pay Per Set', color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)' },
  { key: 'retainer', label: 'Retainer', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-slate-900/95 border border-slate-600 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.color, boxShadow: `0 0 6px ${d.payload.color}` }} />
        <span className="text-[11px] font-medium text-white">{d.name}</span>
      </div>
      <p className="text-xs font-bold text-emerald-400 mt-0.5">${d.value.toLocaleString()}</p>
      <p className="text-[10px] text-slate-400">{d.payload.count} client{d.payload.count !== 1 ? 's' : ''}</p>
    </div>
  );
};

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

    return { name: bt.label, value: revenue, color: bt.color, glow: bt.glow, count: btClients.length };
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
        <div className="flex items-center gap-5">
          <div className="w-40 h-40 relative flex-shrink-0">
            {/* Animated glow ring */}
            <motion.div
              className="absolute inset-1 rounded-full"
              style={{ boxShadow: '0 0 20px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.08)' }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 4px ${entry.glow})` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-lg font-black text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
              >
                ${totalRevenue.toLocaleString()}
              </motion.span>
              <span className="text-[9px] text-slate-400 font-medium">total MTD</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            {breakdown.map((d, i) => {
              const pct = totalRevenue > 0 ? (d.value / totalRevenue) * 100 : 0;
              return (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.glow}` }} />
                      <span className="text-[11px] text-slate-300">{d.name}</span>
                      <span className="text-[10px] text-slate-500">({d.count})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: d.color }}>{pct.toFixed(0)}%</span>
                      <span className="text-[11px] font-bold text-white">${d.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.12, duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}