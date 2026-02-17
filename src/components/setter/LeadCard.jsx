import React from 'react';
import { Phone, Mail, Clock, Building2, Tag, Ban } from 'lucide-react';

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
    <div
      className={`bg-white rounded-lg border p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer ${
        lead.status === 'disqualified' ? 'border-red-200 bg-red-50/30' :
        urgency === 'high' ? 'border-red-300 bg-red-50/30' :
        urgency === 'medium' ? 'border-amber-300 bg-amber-50/30' :
        'border-gray-200'
      }`}
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{lead.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-500 truncate">{clientName}</span>
          </div>
        </div>
        {speedLabel && lead.status !== 'disqualified' && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ml-2 ${
            urgency === 'high' ? 'bg-red-100 text-red-700' :
            urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-600'
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

      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2.5">
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
        <p className="text-[11px] text-gray-400 truncate mb-2">{lead.notes}</p>
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
          <span className="text-[11px] text-green-700 font-medium">
            📅 {new Date(lead.appointment_date).toLocaleDateString()} {new Date(lead.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}