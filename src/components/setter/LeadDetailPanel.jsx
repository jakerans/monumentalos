import React from 'react';
import { Phone, Mail, Building2, Calendar, Clock, Briefcase, Ruler, DollarSign, Tag, User, Ban } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const SOURCE_LABELS = { form: 'Form', msg: 'MSG', quiz: 'Quiz', inbound_call: 'Inbound Call' };
const DQ_LABELS = {
  looking_for_work: 'Looking For Work',
  not_interested: 'Not Interested',
  wrong_invalid_number: 'Wrong/Invalid Number',
  project_size: 'Project Size',
  oosa: 'OOSA',
  client_availability: 'Client Availability',
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
      <div>
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function LeadDetailPanel({ lead, clientName, setterName, bookedByName, open, onOpenChange, onAction }) {
  if (!lead) return null;

  const statusLabel = {
    new: 'New Lead',
    first_call_made: 'First Call Made',
    contacted: 'Contacted',
    appointment_booked: 'Appointment Booked',
    disqualified: 'Disqualified',
    completed: 'Completed',
  };

  const statusColor = {
    new: 'bg-blue-100 text-blue-800',
    first_call_made: 'bg-amber-100 text-amber-800',
    contacted: 'bg-amber-100 text-amber-800',
    appointment_booked: 'bg-green-100 text-green-800',
    disqualified: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden">
        <SheetHeader className="p-5 pb-3 border-b border-gray-200 bg-gray-50">
          <SheetTitle className="text-lg font-bold">{lead.name}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[lead.status] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabel[lead.status] || lead.status}
            </span>
            {lead.disposition && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                {lead.disposition}
              </span>
            )}
            {lead.lead_source && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                {SOURCE_LABELS[lead.lead_source] || lead.lead_source}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Quick Actions */}
          <div className="flex gap-2">
            {lead.status === 'new' && (
              <button
                onClick={() => { onAction('first_call', lead); onOpenChange(false); }}
                className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Phone className="w-3.5 h-3.5 inline mr-1.5" />First Call
              </button>
            )}
            {(lead.status === 'first_call_made' || lead.status === 'contacted') && (
              <>
                <button
                  onClick={() => { onAction('disqualify', lead); onOpenChange(false); }}
                  className="flex-1 text-sm px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                >
                  <Ban className="w-3.5 h-3.5 inline mr-1.5" />Disqualify
                </button>
                <button
                  onClick={() => { onAction('book', lead); onOpenChange(false); }}
                  className="flex-1 text-sm px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />Book Appt
                </button>
              </>
            )}
          </div>

          {/* DQ Info */}
          {lead.status === 'disqualified' && lead.dq_reason && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-0.5">Disqualified</p>
              <p className="text-sm text-red-700">{DQ_LABELS[lead.dq_reason] || lead.dq_reason}</p>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2.5">Contact</h3>
            <div className="space-y-2.5">
              <InfoRow icon={Phone} label="Phone" value={lead.phone} />
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Building2} label="Client" value={clientName} />
            </div>
          </div>

          {/* Setter Info */}
          {(setterName || bookedByName) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2.5">Setters</h3>
              <div className="space-y-2.5">
                {setterName && <InfoRow icon={User} label="First Call By" value={setterName} />}
                {bookedByName && <InfoRow icon={User} label="Booked By" value={bookedByName} />}
              </div>
            </div>
          )}

          {/* Appointment */}
          {lead.appointment_date && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2.5">Appointment</h3>
              <div className="space-y-2.5">
                <InfoRow icon={Calendar} label="Date & Time" value={new Date(lead.appointment_date).toLocaleString()} />
                {lead.date_appointment_set && (
                  <InfoRow icon={Clock} label="Booked On" value={new Date(lead.date_appointment_set).toLocaleString()} />
                )}
              </div>
            </div>
          )}

          {/* Timing */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2.5">Timing</h3>
            <div className="space-y-2.5">
              <InfoRow icon={Clock} label="Lead Received" value={lead.lead_received_date ? new Date(lead.lead_received_date).toLocaleString() : new Date(lead.created_date).toLocaleString()} />
              {lead.first_call_made_date && (
                <InfoRow icon={Phone} label="First Call" value={new Date(lead.first_call_made_date).toLocaleString()} />
              )}
              {lead.speed_to_lead_minutes != null && (
                <InfoRow icon={Clock} label="Speed to Lead" value={`${lead.speed_to_lead_minutes} min`} />
              )}
            </div>
          </div>

          {/* Project */}
          {(lead.project_type || lead.project_size || lead.timeline) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2.5">Project Details</h3>
              <div className="space-y-2.5">
                <InfoRow icon={Briefcase} label="Type" value={lead.project_type} />
                <InfoRow icon={Ruler} label="Size" value={lead.project_size} />
                <InfoRow icon={Clock} label="Timeline" value={lead.timeline} />
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2.5">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400">Created: {new Date(lead.created_date).toLocaleString()}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}