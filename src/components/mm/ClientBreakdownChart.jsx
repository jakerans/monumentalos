import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { motion } from 'framer-motion';

const DQ_COLOR = '#f87171';
const APPTS_COLOR = '#D6FF03';
const LEADS_COLOR = '#8b5cf6';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600/50 rounded-xl p-3.5 text-xs shadow-2xl shadow-black/40">
      <p className="font-bold text-white mb-2 text-sm">{d.fullName || d.name}</p>
      <div className="space-y-1.5 text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" />Total Leads</span>
          <span className="font-bold text-white">{d.totalLeads}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: APPTS_COLOR }} />Appts Set</span>
          <span className="font-bold" style={{ color: APPTS_COLOR }}>{d.appts}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Disqualified</span>
          <span className="font-bold text-red-400">{d.dq}</span>
        </div>
        <div className="pt-1.5 mt-1 border-t border-slate-700/50 flex items-center justify-between gap-4">
          <span>Connection Rate</span>
          <span className={`font-bold ${d.connectionRate < 50 ? 'text-red-400' : 'text-emerald-400'}`}>{d.connectionRate.toFixed(0)}%</span>
        </div>
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-[0.06] pointer-events-none" style={{ background: APPTS_COLOR }} />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-[0.04] pointer-events-none" style={{ background: LEADS_COLOR }} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-bold text-white">Client Lead Breakdown</h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: LEADS_COLOR, boxShadow: `0 0 6px ${LEADS_COLOR}66` }} /> Remaining
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: APPTS_COLOR, boxShadow: `0 0 6px ${APPTS_COLOR}66` }} /> Appts Set
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: DQ_COLOR, boxShadow: `0 0 6px ${DQ_COLOR}66` }} /> DQ'd
          </span>
        </div>
      </div>
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 24, right: 10, left: 10, bottom: 40 }} barCategoryGap="20%">
            <defs>
              <linearGradient id="apptsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={APPTS_COLOR} stopOpacity={1} />
                <stop offset="100%" stopColor={APPTS_COLOR} stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="dqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DQ_COLOR} stopOpacity={0.9} />
                <stop offset="100%" stopColor={DQ_COLOR} stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LEADS_COLOR} stopOpacity={1} />
                <stop offset="100%" stopColor={LEADS_COLOR} stopOpacity={0.55} />
              </linearGradient>
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <XAxis
              dataKey="name"
              tick={({ x, y, payload }) => {
                const item = data.find(d => d.name === payload.value);
                return (
                  <text x={x} y={y + 14} textAnchor="middle" fontSize={10} fill={item?.lowConnection ? '#f87171' : '#cbd5e1'} fontWeight={item?.lowConnection ? 700 : 500}>
                    {payload.value}
                  </text>
                );
              }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(214,255,3,0.03)', radius: 6 }} />
            <Bar dataKey="appts" stackId="a" fill="url(#apptsGrad)" radius={[0, 0, 4, 4]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            <Bar dataKey="dq" stackId="a" fill="url(#dqGrad)" radius={[0, 0, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            <Bar dataKey="remaining" stackId="a" fill="url(#leadsGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
              <LabelList
                content={({ x, y, width, index }) => {
                  const item = data[index];
                  if (!item || item.totalLeads === 0) return null;
                  const rate = `${item.connectionRate.toFixed(0)}%`;
                  const isLow = item.lowConnection;
                  return (
                    <g>
                      <rect
                        x={x + width / 2 - 16}
                        y={y - 18}
                        width={32}
                        height={14}
                        rx={4}
                        fill={isLow ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.1)'}
                      />
                      <text
                        x={x + width / 2}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill={isLow ? '#f87171' : '#94a3b8'}
                      >
                        {rate}
                      </text>
                    </g>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}