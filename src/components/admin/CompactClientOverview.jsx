import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle } from 'lucide-react';

export default function CompactClientOverview({ clients, leads, spend }) {
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = clients.filter(c => c.status === 'active').map(client => {
    const cLeads = leads.filter(l => l.client_id === client.id);
    const mtdLeads = cLeads.filter(l => new Date(l.created_date) >= mtdStart).length;
    const mtdBooked = cLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    const mtdSpend = spend.filter(s => s.client_id === client.id && new Date(s.date) >= mtdStart).reduce((s, r) => s + (r.amount || 0), 0);
    const cpa = mtdBooked > 0 ? mtdSpend / mtdBooked : null;
    const alert = (cpa !== null && cpa > 300) || (mtdSpend > 500 && mtdBooked === 0);
    return { ...client, mtdLeads, mtdBooked, mtdSpend, cpa, alert };
  }).sort((a, b) => (b.alert ? 1 : 0) - (a.alert ? 1 : 0) || b.mtdBooked - a.mtdBooked);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Client Snapshot (MTD)</h2>
        <Link to={createPageUrl('ClientPerformance')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-right">Leads</th>
              <th className="px-3 py-2 text-right">Booked</th>
              <th className="px-3 py-2 text-right">Spend</th>
              <th className="px-3 py-2 text-right">CPA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.slice(0, 8).map(r => (
              <tr key={r.id} className={`hover:bg-gray-50 ${r.alert ? 'bg-red-50/40' : ''}`}>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {r.alert && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700 truncate max-w-[160px]">{r.name}</Link>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-right text-gray-700">{r.mtdLeads}</td>
                <td className="px-3 py-2 text-xs text-right text-gray-700">{r.mtdBooked}</td>
                <td className="px-3 py-2 text-xs text-right text-gray-700">${r.mtdSpend.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right">
                  <span className={`font-semibold ${r.cpa !== null && r.cpa > 300 ? 'text-red-600' : r.cpa !== null && r.cpa > 200 ? 'text-amber-600' : 'text-green-600'}`}>
                    {r.cpa !== null ? `$${r.cpa.toFixed(0)}` : '—'}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-400">No active clients</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}