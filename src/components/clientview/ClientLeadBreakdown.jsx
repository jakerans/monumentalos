import React from 'react';
import { motion } from 'framer-motion';

const BAR_PALETTES = [
  { bar: '#D6FF03', glow: 'rgba(214,255,3,0.35)', bg: 'rgba(214,255,3,0.08)' },
  { bar: '#8b5cf6', glow: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.08)' },
  { bar: '#3b82f6', glow: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.08)' },
  { bar: '#10b981', glow: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.08)' },
  { bar: '#f59e0b', glow: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)' },
  { bar: '#ec4899', glow: 'rgba(236,72,153,0.35)', bg: 'rgba(236,72,153,0.08)' },
  { bar: '#06b6d4', glow: 'rgba(6,182,212,0.35)', bg: 'rgba(6,182,212,0.08)' },
];

export default function ClientLeadBreakdown({ leads }) {
  // Status breakdown
  const statusCounts = {};
  leads.forEach(l => {
    const s = l.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  // Source breakdown
  const sourceCounts = {};
  leads.forEach(l => {
    const s = l.lead_source || 'unknown';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });

  // DQ reason breakdown
  const dqLeads = leads.filter(l => l.status === 'disqualified');
  const dqReasons = {};
  dqLeads.forEach(l => {
    const r = l.dq_reason || 'unspecified';
    dqReasons[r] = (dqReasons[r] || 0) + 1;
  });

  const statusLabels = {
    new: 'New', first_call_made: 'First Call Made', contacted: 'Contacted',
    appointment_booked: 'Appt Booked', disqualified: 'Disqualified', completed: 'Completed'
  };

  const sourceLabels = {
    form: 'Form', msg: 'Message', quiz: 'Quiz', inbound_call: 'Inbound Call', unknown: 'Unknown'
  };

  const dqLabels = {
    looking_for_work: 'Looking for Work', not_interested: 'Not Interested',
    wrong_invalid_number: 'Wrong/Invalid #', project_size: 'Project Size',
    oosa: 'Out of Service Area', client_availability: 'Client Availability', unspecified: 'Unspecified'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <BreakdownCard title="Lead Status" data={statusCounts} labels={statusLabels} total={leads.length} />
      <BreakdownCard title="Lead Source" data={sourceCounts} labels={sourceLabels} total={leads.length} />
      <BreakdownCard title="DQ Reasons" data={dqReasons} labels={dqLabels} total={dqLeads.length} emptyMsg="No disqualified leads" />
    </div>
  );
}

function BreakdownCard({ title, data, labels, total, emptyMsg }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <h3 className="text-sm font-bold text-white mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyMsg || 'No data'}</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([key, count], i) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
            const palette = BAR_PALETTES[i % BAR_PALETTES.length];
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">{labels[key] || key}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold" style={{ color: palette.bar }}>{count}</span>
                    <span className="text-[10px] text-slate-500">({pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(30,41,59,0.7)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${palette.bar}cc, ${palette.bar})`,
                      boxShadow: `0 0 8px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(Number(pct), 2)}%` }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}