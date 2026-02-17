import React from 'react';
import { Calendar, Phone, Mail } from 'lucide-react';

const dispositionStyle = {
  showed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-purple-100 text-purple-800',
  scheduled: 'bg-blue-100 text-blue-800',
};

const outcomeStyle = {
  sold: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

export default function AppointmentCard({ lead, onSelect }) {
  return (
    <div
      onClick={() => onSelect(lead.id)}
      className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-base">{lead.name}</h3>
        <div className="flex gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${dispositionStyle[lead.disposition] || dispositionStyle.scheduled}`}>
            {lead.disposition || 'scheduled'}
          </span>
          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${outcomeStyle[lead.outcome] || outcomeStyle.pending}`}>
            {lead.outcome || 'pending'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{new Date(lead.appointment_date).toLocaleString()}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {lead.sale_amount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm font-bold text-green-700">${lead.sale_amount.toLocaleString()}</span>
          <span className="text-xs text-gray-500 ml-1">revenue</span>
        </div>
      )}
    </div>
  );
}