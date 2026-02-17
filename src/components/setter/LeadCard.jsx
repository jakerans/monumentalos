import React from 'react';
import { Phone, Mail, Clock, Building2, Tag, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

function timeSince(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  const mins = Math.floor((now - d) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const SOURCE_LABELS = { form: 'Form', msg: 'MSG', quiz: 'Quiz', inbound_call: 'Inbound Call' };
const SOURCE_COLORS = {
  form: 'bg-indigo-100 text-indigo-700',
  msg: 'bg-sky-100 text-sky-700',
  quiz: 'bg-teal-100 text-teal-700',
  inbound_call: 'bg-orange-100 text-orange-700',
};

const DQ_LABELS = {
  looking_for_work: 'Looking For Work',
  not_interested: 'Not Interested',
  wrong_invalid_number: 'Wrong/Invalid Number',
  project_size: 'Project Size',
  oosa: 'OOSA',
  client_availability: 'Client Availability',
};

export default function LeadCard({ lead, clientName, onAction, onSelect, urgency }) {
  const speedLabel = lead.lead_received_date ? timeSince(lead.lead_received_date) : timeSince(lead.created_date);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`bg-slate-800/60 rounded-lg border p-3 sm:p-4 hover:shadow-lg hover:shadow-black/20 transition-shadow cursor-pointer ${
        lead.status === 'disqualified' ? 'border-red-500/30 bg-red-500/10' :
        urgency === 'high' ? 'border-red-500/40 bg-red-500/10' :
        urgency === 'medium' ? 'border-amber-500/40 bg-amber-500/10' :
        'border-slate-700/50'
      }`}
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white truncate">{lead.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-[11px] text-slate-400 truncate">{clientName}</span>
          </div>
        </div>
        {speedLabel && lead.status !== 'disqualified' && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ml-2 ${
            urgency === 'high' ? 'bg-red-500/20 text-red-400' :
            urgency === 'medium' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
            {speedLabel}
          </span>
        )}
      </div>

      {/* Source badge */}
      <div className="flex items-center gap-1.5 mb-2">
        {lead.lead_source && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_COLORS[lead.lead_source] || 'bg-gray-100 text-gray-600'}`}>
            {SOURCE_LABELS[lead.lead_source] || lead.lead_source}
          </span>
        )}
        {lead.status === 'disqualified' && lead.dq_reason && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
            DQ: {DQ_LABELS[lead.dq_reason] || lead.dq_reason}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2.5">
        {lead.phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />{lead.phone}
          </span>
        )}
        {lead.email && (
          <span className="flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{lead.email}</span>
          </span>
        )}
      </div>

      {lead.notes && (
        <p className="text-[11px] text-slate-500 truncate mb-2">{lead.notes}</p>
      )}

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {lead.status === 'new' && (
          <button
            onClick={() => onAction('first_call', lead)}
            className="flex-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            <Phone className="w-3 h-3 inline mr-1" />First Call
          </button>
        )}
        {(lead.status === 'first_call_made' || lead.status === 'contacted') && (
          <>
            <button
              onClick={() => onAction('disqualify', lead)}
              className="flex-1 text-xs px-2.5 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium transition-colors"
            >
              <Ban className="w-3 h-3 inline mr-1" />Disqualify
            </button>
            <button
              onClick={() => onAction('book', lead)}
              className="flex-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
            >
              Book Appt
            </button>
          </>
        )}
        {lead.status === 'appointment_booked' && lead.appointment_date && (
          <span className="text-[11px] text-green-400 font-medium">
            📅 {new Date(lead.appointment_date).toLocaleDateString()} {new Date(lead.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}