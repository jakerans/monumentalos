import React from 'react';

function FunnelStep({ label, count, pct, color, isLast }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 rounded-lg p-3 ${color}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-lg font-bold">{count}</span>
        </div>
      </div>
      {!isLast && (
        <div className="text-xs font-semibold text-slate-500 w-12 text-center">
          {pct}%<br />↓
        </div>
      )}
    </div>
  );
}

export default function ClientFunnel({ metrics }) {
  const { totalLeads, apptsBooked, apptsShowed, jobsSold } = metrics;

  const steps = [
    { label: 'Leads', count: totalLeads, color: 'bg-blue-500/10 text-blue-400', pct: totalLeads > 0 ? ((apptsBooked / totalLeads) * 100).toFixed(0) : '0' },
    { label: 'Booked', count: apptsBooked, color: 'bg-indigo-500/10 text-indigo-400', pct: apptsBooked > 0 ? ((apptsShowed / apptsBooked) * 100).toFixed(0) : '0' },
    { label: 'Showed', count: apptsShowed, color: 'bg-green-500/10 text-green-400', pct: apptsShowed > 0 ? ((jobsSold / apptsShowed) * 100).toFixed(0) : '0' },
    { label: 'Sold', count: jobsSold, color: 'bg-emerald-500/10 text-emerald-400', pct: null },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <h3 className="text-sm font-bold text-white mb-3">Conversion Funnel</h3>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <FunnelStep key={step.label} {...step} isLast={i === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}