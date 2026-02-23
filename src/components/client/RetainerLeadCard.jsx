import React from 'react';
import { Phone, Mail, Calendar, AlertTriangle } from 'lucide-react';

const STATUS_BADGES = {
  new: { label: 'New', bg: '#D6FF03', text: 'text-black' },
  first_call_made: { label: 'Called', bg: 'rgb(59,130,246)', text: 'text-white' },
  contacted: { label: 'Contacted', bg: 'rgb(168,85,247)', text: 'text-white' },
  appointment_booked: { label: 'Booked', bg: 'rgb(34,197,94)', text: 'text-white' },
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function RetainerLeadCard({ lead, onSelect, isStale }) {
  const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.new;

  return (
    <div
      onClick={() => onSelect(lead.id)}
      className={`bg-slate-800/60 rounded-lg shadow border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isStale ? 'border-l-2 border-l-amber-500 border-t-slate-700/50 border-r-slate-700/50 border-b-slate-700/50' : 'border-slate-700/50'
      }`}
    >
      {/* Row 1: Name + status */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white text-base truncate mr-2">{lead.name}</h3>
        <span
          className={`px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${badge.text}`}
          style={{ backgroundColor: badge.bg }}
        >
          {badge.label}
        </span>
      </div>

      {/* Row 2: Contact */}
      <div className="space-y-1 text-sm text-slate-400 mb-2">
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {/* Row 3: Tags */}
      {(lead.industries?.length > 0 || lead.project_type || lead.project_size) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.industries?.map(ind => (
            <span key={ind} className="px-1.5 py-0.5 text-[10px] bg-slate-700/60 text-slate-400 rounded">{ind}</span>
          ))}
          {lead.project_type && <span className="px-1.5 py-0.5 text-[10px] bg-slate-700/60 text-slate-400 rounded">{lead.project_type}</span>}
          {lead.project_size && <span className="px-1.5 py-0.5 text-[10px] bg-slate-700/60 text-slate-400 rounded">{lead.project_size}</span>}
        </div>
      )}

      {/* Row 4: Received time */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>Received {relativeTime(lead.created_date || lead.lead_received_date)}</span>
        {isStale && (
          <span className="flex items-center gap-0.5 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-medium">Needs attention</span>
          </span>
        )}
      </div>

      {/* Appointment date if booked */}
      {lead.status === 'appointment_booked' && lead.appointment_date && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <span>{new Date(lead.appointment_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
}