import React from 'react';
import LeadCard from './LeadCard';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function PipelineColumn({ title, count, color, leads, clients, onAction, onSelect }) {
  const clientMap = React.useMemo(() => {
    const map = {};
    (clients || []).forEach(c => { map[c.id] = c.name; });
    return map;
  }, [clients]);
  const getClientName = (clientId) => clientMap[clientId] || 'Unknown';

  const getUrgency = (lead) => {
    if (lead.status !== 'new') return 'low';
    const received = lead.lead_received_date || lead.created_date;
    const mins = Math.floor((new Date() - new Date(received)) / 60000);
    if (mins <= 5) return 'high';
    if (mins <= 30) return 'medium';
    return 'low';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col min-w-0"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${color}`}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div ref={useAutoAnimate({ duration: 300, easing: 'ease-out' })[0]} className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {leads.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
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
    </motion.div>
  );
}