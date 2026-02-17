import React from 'react';

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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyMsg || 'No data'}</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{labels[key] || key}</span>
                  <span className="font-medium text-gray-900">{count} <span className="text-gray-400">({pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}