import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, Calendar, DollarSign, Clock, Briefcase, Ruler, FileText, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const DISPOSITION_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', bg: 'bg-blue-100 text-blue-800 border-blue-300', activeBg: 'bg-blue-600 text-white' },
  { value: 'showed', label: 'Showed', bg: 'bg-green-100 text-green-800 border-green-300', activeBg: 'bg-green-600 text-white' },
  { value: 'cancelled', label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-300', activeBg: 'bg-red-600 text-white' },
  { value: 'rescheduled', label: 'Rescheduled', bg: 'bg-purple-100 text-purple-800 border-purple-300', activeBg: 'bg-purple-600 text-white' },
];

function InfoRow({ icon: Icon, label, value, iconColor = 'text-gray-400' }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className={`w-4 h-4 mt-0.5 ${iconColor}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function LeadDetailsDrawer({ leadId, open, onOpenChange, onLeadUpdated }) {
  const queryClient = useQueryClient();

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0];
    },
    enabled: !!leadId && open,
  });

  const handleDispositionChange = async (newDisposition) => {
    if (!lead) return;
    await base44.entities.Lead.update(lead.id, { disposition: newDisposition });
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    if (onLeadUpdated) onLeadUpdated();
  };

  const currentDisposition = lead?.disposition || 'scheduled';

  // Speed to lead
  const speedToLead = lead?.speed_to_lead_minutes != null
    ? (lead.speed_to_lead_minutes < 60 ? `${lead.speed_to_lead_minutes} min` : `${(lead.speed_to_lead_minutes / 60).toFixed(1)} hrs`)
    : null;

  // Days since lead received
  const daysSinceReceived = lead?.lead_received_date
    ? Math.floor((new Date() - new Date(lead.lead_received_date)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {!lead ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-gray-200 bg-gray-50">
              <SheetTitle className="text-xl font-bold">{lead.name}</SheetTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                  lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                  lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {currentDisposition}
                </span>
                {lead.outcome && lead.outcome !== 'pending' && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lead.outcome}
                  </span>
                )}
                {lead.sale_amount && (
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                    ${lead.sale_amount.toLocaleString()}
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="p-6 space-y-6">
              {/* Disposition buttons */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Disposition</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DISPOSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleDispositionChange(opt.value)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                        currentDisposition === opt.value
                          ? opt.activeBg + ' border-transparent shadow-sm'
                          : opt.bg + ' hover:opacity-80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact</h3>
                <div className="space-y-3">
                  <InfoRow icon={Mail} label="Email" value={lead.email} />
                  <InfoRow icon={Phone} label="Phone" value={lead.phone} />
                </div>
              </div>

              {/* Appointment */}
              {lead.appointment_date && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Appointment</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Calendar} label="Appointment Date" value={new Date(lead.appointment_date).toLocaleString()} />
                    <InfoRow icon={Calendar} label="Date Booked" value={lead.date_appointment_set ? new Date(lead.date_appointment_set).toLocaleString() : null} />
                  </div>
                </div>
              )}

              {/* Lead Timing */}
              {(lead.lead_received_date || speedToLead) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Lead Timing</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Calendar} label="Lead Received" value={lead.lead_received_date ? new Date(lead.lead_received_date).toLocaleString() : null} />
                    <InfoRow icon={Clock} label="Speed to Lead" value={speedToLead} iconColor="text-orange-500" />
                    <InfoRow icon={Clock} label="Days Since Received" value={daysSinceReceived != null ? `${daysSinceReceived} days` : null} />
                    <InfoRow icon={Calendar} label="First Call Made" value={lead.first_call_made_date ? new Date(lead.first_call_made_date).toLocaleString() : null} />
                  </div>
                </div>
              )}

              {/* Project Details */}
              {(lead.project_type || lead.project_size || lead.budget_range || lead.timeline) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Project Details</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Briefcase} label="Project Type" value={lead.project_type} />
                    <InfoRow icon={Ruler} label="Project Size" value={lead.project_size} />
                    <InfoRow icon={DollarSign} label="Budget Range" value={lead.budget_range} iconColor="text-green-500" />
                    <InfoRow icon={Clock} label="Timeline" value={lead.timeline} />
                  </div>
                </div>
              )}

              {/* Sale Information */}
              {(lead.sale_amount || lead.date_sold) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Sale Information</h3>
                  <div className="space-y-3">
                    <InfoRow icon={DollarSign} label="Sale Amount" value={lead.sale_amount ? `$${lead.sale_amount.toLocaleString()}` : null} iconColor="text-green-600" />
                    <InfoRow icon={Calendar} label="Date Sold" value={lead.date_sold ? new Date(lead.date_sold).toLocaleDateString() : null} />
                  </div>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Created: {new Date(lead.created_date).toLocaleDateString()}</span>
                  {lead.updated_date && <span>Updated: {new Date(lead.updated_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}