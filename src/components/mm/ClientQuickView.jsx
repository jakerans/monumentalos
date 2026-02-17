import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, ExternalLink, AlertTriangle, TrendingUp, DollarSign, Users, Calendar, Clock, MapPin } from 'lucide-react';

function Stat({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-md p-2">
      <p className="text-[10px] text-gray-500 uppercase font-medium">{label}</p>
      <p className={`text-sm font-bold ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export default function ClientQuickView({ client, onClose }) {
  if (!client) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 truncate">{client.name}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Alerts */}
        {client.alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Alerts
            </p>
            {client.alerts.map((alert, i) => (
              <p key={i} className="text-xs text-red-600">• {alert}</p>
            ))}
          </div>
        )}

        {/* 7-Day Performance */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Last 7 Days</p>
          <div className="grid grid-cols-2 gap-1.5">
            <Stat label="Ad Spend" value={`$${client.spend7d.toLocaleString()}`} />
            <Stat label="Leads" value={client.leads7d} />
            <Stat label="Appts Set" value={client.appts7d} />
            <Stat label="CPA" value={client.cpa7d === Infinity || isNaN(client.cpa7d) ? '—' : `$${client.cpa7d.toFixed(0)}`} color={client.cpa7d > 300 ? 'text-red-600' : client.cpa7d > 200 ? 'text-amber-600' : 'text-green-600'} />
            <Stat label="Avg STL" value={client.stl === null ? '—' : `${client.stl.toFixed(0)} min`} color={client.stl !== null && client.stl > 15 ? 'text-red-600' : 'text-green-600'} />
            <Stat label="Show Rate" value={client.showRate7d} />
          </div>
        </div>

        {/* 30-Day Performance */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Last 30 Days</p>
          <div className="grid grid-cols-2 gap-1.5">
            <Stat label="Ad Spend" value={`$${client.spend30d.toLocaleString()}`} />
            <Stat label="Leads" value={client.leads30d} />
            <Stat label="Appts Set" value={client.appts30d} />
            <Stat label="CPA" value={client.cpa30d === Infinity || isNaN(client.cpa30d) ? '—' : `$${client.cpa30d.toFixed(0)}`} />
          </div>
        </div>

        {/* Client Info */}
        {(client.service_radius || client.target_zip_codes) && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Settings</p>
            <div className="space-y-1.5 text-xs text-gray-600">
              {client.service_radius && (
                <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-gray-400" /> Radius: {client.service_radius}</p>
              )}
              {client.target_zip_codes && (
                <p className="flex items-center gap-1.5 break-all"><MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" /> Targets: {client.target_zip_codes}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-100 space-y-1.5">
        <Link
          to={createPageUrl('ClientView') + `?clientId=${client.id}`}
          className="w-full px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3 h-3" /> Full Client View
        </Link>
        <button
          onClick={() => {
            localStorage.setItem('admin_view_client_id', client.id);
            window.open(createPageUrl('ClientPortal'), '_blank');
          }}
          className="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
        >
          View as Client
        </button>
      </div>
    </div>
  );
}