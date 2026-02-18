import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import ClientRow from './ClientRow';

const HEADERS = [
  { key: 'name', label: 'Client', align: 'left' },
  { key: 'goalProgress', label: 'Goal', align: 'right' },
  { key: 'goalStatusSort', label: 'Status', align: 'left' },
  { key: 'spendCur', label: 'Spend', align: 'right' },
  { key: 'leadsCur', label: 'Leads', align: 'right' },
  { key: 'apptsCur', label: 'Appts', align: 'right' },
  { key: 'cpaCur', label: 'CPA', align: 'right' },
  { key: 'stl', label: 'Avg STL', align: 'right' },
  { key: 'showRateCur', label: 'Show %', align: 'right' },
  { key: 'alerts', label: 'Alerts', align: 'right' },
  { key: 'action', label: '', align: 'right' },
];

export default function ClientTable({ clientMetrics, onSelectClient }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('alerts');
  const [sortDir, setSortDir] = useState(-1);
  const [filterAlerts, setFilterAlerts] = useState(false);

  const handleSort = (key) => {
    if (key === 'action') return;
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  };

  let filtered = clientMetrics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filterAlerts) {
    filtered = filtered.filter(c => c.alerts.length > 0);
  }

  filtered.sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (sortKey === 'alerts') { aVal = a.alerts.length; bVal = b.alerts.length; }
    if (sortKey === 'name') return sortDir * aVal.localeCompare(bVal);
    if (sortKey === 'showRateCur') { aVal = parseFloat(aVal) || 0; bVal = parseFloat(bVal) || 0; }
    if (aVal === null || aVal === Infinity) aVal = -Infinity * sortDir;
    if (bVal === null || bVal === Infinity) bVal = -Infinity * sortDir;
    return sortDir * (aVal - bVal);
  });

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-sm flex-1 flex flex-col min-h-0">
      <div className="px-3 py-2.5 border-b border-slate-700/50 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
          />
        </div>
        <button
          onClick={() => setFilterAlerts(!filterAlerts)}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            filterAlerts ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-slate-700 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Filter className="w-3 h-3" /> Alerts Only
        </button>
        <span className="text-xs text-slate-500">{filtered.length} clients</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 sticky top-0 z-10">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h.key}
                  onClick={() => handleSort(h.key)}
                  className={`px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap ${
                    h.align === 'right' ? 'text-right' : 'text-left'
                  } ${h.key !== 'action' ? 'cursor-pointer hover:text-white select-none' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {h.label}
                    {sortKey === h.key && h.key !== 'action' && (
                      <ArrowUpDown className="w-3 h-3 text-blue-500" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={useAutoAnimate({ duration: 250, easing: 'ease-out' })[0]} className="divide-y divide-slate-700/30">
            {filtered.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onClick={() => onSelectClient(client)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                  {search ? 'No clients match your search' : 'No clients found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}