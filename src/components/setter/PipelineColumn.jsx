import React from 'react';
import LeadCard from './LeadCard';

export default function PipelineColumn({ title, count, color, leads, clients, onAction, onSelect }) {
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const getUrgency = (lead) => {
    if (lead.status !== 'new') return 'low';
    const received = lead.lead_received_date || lead.created_date;
    const mins = Math.floor((new Date() - new Date(received)) / 60000);
    if (mins <= 5) return 'high';
    if (mins <= 30) return 'medium';
    return 'low';
  };

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {leads.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No leads
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              clientName={getClientName(lead.client_id)}
              onAction={onAction}
              onSelect={onSelect}
              urgency={getUrgency(lead)}
            />
          ))
        )}
      </div>
    </div>
  );
}