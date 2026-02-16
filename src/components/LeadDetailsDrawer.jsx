import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, Calendar, DollarSign } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export default function LeadDetailsDrawer({ leadId, open, onOpenChange }) {
  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0];
    },
    enabled: !!leadId && open,
  });

  if (!lead) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-gray-200 bg-gray-50">
          <DrawerTitle className="text-2xl">{lead.name}</DrawerTitle>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
              lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
              lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {lead.disposition || 'scheduled'}
            </span>
            {lead.outcome && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                lead.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {lead.outcome}
              </span>
            )}
          </div>
        </DrawerHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{lead.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{lead.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {lead.appointment_date && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Appointment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Appointment Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.appointment_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                {lead.date_appointment_set && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date Booked</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(lead.date_appointment_set).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(lead.project_type || lead.project_size || lead.budget_range || lead.timeline) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.project_type && (
                  <div>
                    <p className="text-xs text-gray-500">Project Type</p>
                    <p className="text-sm font-medium text-gray-900">{lead.project_type}</p>
                  </div>
                )}
                {lead.project_size && (
                  <div>
                    <p className="text-xs text-gray-500">Project Size</p>
                    <p className="text-sm font-medium text-gray-900">{lead.project_size}</p>
                  </div>
                )}
                {lead.budget_range && (
                  <div>
                    <p className="text-xs text-gray-500">Budget Range</p>
                    <p className="text-sm font-medium text-gray-900">{lead.budget_range}</p>
                  </div>
                )}
                {lead.timeline && (
                  <div>
                    <p className="text-xs text-gray-500">Timeline</p>
                    <p className="text-sm font-medium text-gray-900">{lead.timeline}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(lead.sale_amount || lead.date_sold) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Sale Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.sale_amount && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Sale Amount</p>
                      <p className="text-lg font-bold text-green-700">
                        ${lead.sale_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {lead.date_sold && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date Sold</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(lead.date_sold).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {lead.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Notes</h3>
              <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}