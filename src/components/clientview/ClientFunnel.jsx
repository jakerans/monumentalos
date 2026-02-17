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
        <div className="text-xs font-semibold text-gray-400 w-12 text-center">
          {pct}%<br />↓
        </div>
      )}
    </div>
  );
}

export default function ClientFunnel({ metrics }) {
  const { totalLeads, apptsBooked, apptsShowed, jobsSold } = metrics;

  const steps = [
    { label: 'Leads', count: totalLeads, color: 'bg-blue-50 text-blue-800', pct: totalLeads > 0 ? ((apptsBooked / totalLeads) * 100).toFixed(0) : '0' },
    { label: 'Booked', count: apptsBooked, color: 'bg-indigo-50 text-indigo-800', pct: apptsBooked > 0 ? ((apptsShowed / apptsBooked) * 100).toFixed(0) : '0' },
    { label: 'Showed', count: apptsShowed, color: 'bg-green-50 text-green-800', pct: apptsShowed > 0 ? ((jobsSold / apptsShowed) * 100).toFixed(0) : '0' },
    { label: 'Sold', count: jobsSold, color: 'bg-emerald-50 text-emerald-800', pct: null },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Conversion Funnel</h3>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <FunnelStep key={step.label} {...step} isLast={i === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}