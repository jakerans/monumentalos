import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, ExternalLink, AlertTriangle, TrendingUp, DollarSign, Users, Calendar, Clock, MapPin } from 'lucide-react';
import ClientGoalEditor from './ClientGoalEditor';

function Stat({ label, value, color }) {
  return (
    <div className="bg-slate-900/50 rounded-md p-2">
      <p className="text-[10px] text-slate-400 uppercase font-medium">{label}</p>
      <p className={`text-sm font-bold ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function ClientQuickView({ client, onClose, onClientUpdated }) {
  if (!client) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-sm flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white truncate">{client.name}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
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
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Last 7 Days</p>
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
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Last 30 Days</p>
          <div className="grid grid-cols-2 gap-1.5">
            <Stat label="Ad Spend" value={`$${client.spend30d.toLocaleString()}`} />
            <Stat label="Leads" value={client.leads30d} />
            <Stat label="Appts Set" value={client.appts30d} />
            <Stat label="CPA" value={client.cpa30d === Infinity || isNaN(client.cpa30d) ? '—' : `$${client.cpa30d.toFixed(0)}`} />
          </div>
        </div>

        {/* Monthly Goal */}
        <ClientGoalEditor client={client} onSaved={onClientUpdated} />

        {/* Client Info */}
        {(client.service_radius || client.target_zip_codes) && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Settings</p>
            <div className="space-y-1.5 text-xs text-slate-300">
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

      <div className="p-2 border-t border-slate-700/50 space-y-1.5">
        <Link
          to={createPageUrl('ClientView') + `?clientId=${client.id}`}
          className="w-full px-3 py-2 text-xs font-bold text-black rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-1.5" style={{backgroundColor:'#D6FF03'}}
        >
          <ExternalLink className="w-3 h-3" /> Full Client View
        </Link>
        <button
          onClick={() => {
            localStorage.setItem('admin_view_client_id', client.id);
            window.open(createPageUrl('ClientPortal'), '_blank');
          }}
          className="w-full px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"
        >
          View as Client
        </button>
      </div>
    </div>
  );
}