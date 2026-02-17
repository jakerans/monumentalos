import React from 'react';
import { MapPin, DollarSign, Link as LinkIcon, Tag } from 'lucide-react';
import { INDUSTRY_LABELS, INDUSTRY_COLORS } from '../shared/IndustryPicker';

export default function ClientSettingsCard({ client }) {
  if (!client) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <h3 className="text-sm font-bold text-white mb-3">Client Settings</h3>
      <div className="space-y-2.5 text-xs">
        {client.industries && client.industries.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-500">Industry</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {client.industries.map(ind => (
                  <span key={ind} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${INDUSTRY_COLORS[ind] || 'bg-slate-700 text-slate-400'}`}>
                    {INDUSTRY_LABELS[ind] || ind}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <DollarSign className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-slate-500">Billing</p>
            <p className="font-semibold text-white">
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
              <p className="text-slate-500">Service Radius</p>
              <p className="font-semibold text-white">{client.service_radius}</p>
            </div>
          </div>
        )}
        {client.target_zip_codes && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-500">Target Zips</p>
              <p className="font-semibold text-white break-all">{client.target_zip_codes}</p>
            </div>
          </div>
        )}
        {client.negative_zip_codes && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-500">Negative Zips</p>
              <p className="font-semibold text-white break-all">{client.negative_zip_codes}</p>
            </div>
          </div>
        )}
        {client.booking_link && (
          <div className="flex items-start gap-2">
            <LinkIcon className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-500">Booking Link</p>
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