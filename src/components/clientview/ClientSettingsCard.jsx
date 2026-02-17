import React from 'react';
import { MapPin, DollarSign, Link as LinkIcon } from 'lucide-react';

export default function ClientSettingsCard({ client }) {
  if (!client) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Client Settings</h3>
      <div className="space-y-2.5 text-xs">
        <div className="flex items-start gap-2">
          <DollarSign className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Billing</p>
            <p className="font-semibold text-gray-900">
              {client.billing_type === 'pay_per_set' ? `$${client.price_per_set_appointment || 0} / appt set` :
               client.billing_type === 'retainer' ? `$${client.retainer_amount || 0}/mo retainer` :
               `$${client.price_per_shown_appointment || 0} / shown appt`}
            </p>
          </div>
        </div>
        {client.service_radius && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Service Radius</p>
              <p className="font-semibold text-gray-900">{client.service_radius}</p>
            </div>
          </div>
        )}
        {client.target_zip_codes && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Target Zips</p>
              <p className="font-semibold text-gray-900 break-all">{client.target_zip_codes}</p>
            </div>
          </div>
        )}
        {client.negative_zip_codes && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Negative Zips</p>
              <p className="font-semibold text-gray-900 break-all">{client.negative_zip_codes}</p>
            </div>
          </div>
        )}
        {client.booking_link && (
          <div className="flex items-start gap-2">
            <LinkIcon className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Booking Link</p>
              <a href={client.booking_link} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline truncate block max-w-[200px]">
                {client.booking_link}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}