import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const DQ_COLOR = '#f87171';
const APPTS_COLOR = '#4ade80';
const LEADS_COLOR = '#60a5fa';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-bold text-white mb-1.5">{d.name}</p>
      <div className="space-y-1 text-slate-300">
        <p>Total Leads: <span className="text-blue-400 font-semibold">{d.totalLeads}</span></p>
        <p>Appts Set: <span className="text-green-400 font-semibold">{d.appts}</span></p>
        <p>Disqualified: <span className="text-red-400 font-semibold">{d.dq}</span></p>
        <p>Connection Rate: <span className={`font-semibold ${d.connectionRate < 50 ? 'text-red-400' : 'text-emerald-400'}`}>{d.connectionRate.toFixed(0)}%</span></p>
      </div>
    </div>
  );
}

export default function ClientBreakdownChart({ clients, leads, periodStart, periodEnd }) {
  const data = useMemo(() => {
    return clients.map(client => {
      const cLeads = leads.filter(l => {
        if (l.client_id !== client.id) return false;
        const cd = l.created_date;
        return cd >= periodStart && (!periodEnd || cd <= periodEnd);
      });

      const totalLeads = cLeads.length;
      const appts = cLeads.filter(l => l.date_appointment_set).length;
      const dq = cLeads.filter(l => l.status === 'disqualified').length;
      // "remaining" leads that are neither booked nor DQ'd
      const remaining = Math.max(0, totalLeads - appts - dq);

      // Connection rate = leads where a real connection happened / total leads
      // Connected = appointment_booked OR disqualified (they spoke to them) OR contacted
      const connected = cLeads.filter(l =>
        l.status === 'appointment_booked' ||
        l.status === 'disqualified' ||
        l.status === 'contacted' ||
        l.status === 'completed'
      ).length;
      const connectionRate = totalLeads > 0 ? (connected / totalLeads) * 100 : 0;

      return {
        name: client.name?.length > 12 ? client.name.slice(0, 12) + '…' : client.name,
        fullName: client.name,
        totalLeads,
        appts,
        dq,
        remaining,
        connectionRate,
        lowConnection: connectionRate < 50 && totalLeads > 0,
      };
    }).filter(d => d.totalLeads > 0).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [clients, leads, periodStart, periodEnd]);

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 text-center text-xs text-slate-500">
        No lead data for this period
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-sm font-bold text-white">Client Lead Breakdown</h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEADS_COLOR }} /> Remaining</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: APPTS_COLOR }} /> Appts Set</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DQ_COLOR }} /> DQ'd</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
          <XAxis
            dataKey="name"
            tick={({ x, y, payload }) => {
              const item = data.find(d => d.name === payload.value);
              return (
                <text x={x} y={y + 12} textAnchor="middle" fontSize={10} fill={item?.lowConnection ? '#f87171' : '#e2e8f0'} fontWeight={item?.lowConnection ? 600 : 400}>
                  {payload.value}
                </text>
              );
            }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="appts" stackId="a" fill={APPTS_COLOR} radius={[0, 0, 0, 0]} />
          <Bar dataKey="dq" stackId="a" fill={DQ_COLOR} radius={[0, 0, 0, 0]} />
          <Bar dataKey="remaining" stackId="a" fill={LEADS_COLOR} radius={[4, 4, 0, 0]}>
            <LabelList
              content={({ x, y, width, index }) => {
                const item = data[index];
                if (!item || item.totalLeads === 0) return null;
                const rate = `${item.connectionRate.toFixed(0)}%`;
                return (
                  <text
                    x={x + width / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill={item.lowConnection ? '#f87171' : '#94a3b8'}
                  >
                    {rate}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}