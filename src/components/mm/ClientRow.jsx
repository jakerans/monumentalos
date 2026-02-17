import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function ClientRow({ client, onClick }) {
  const { name, spend7d, leads7d, appts7d, cpa7d, stl, showRate7d, alerts } = client;
  const hasAlert = alerts.length > 0;

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors hover:bg-blue-50 ${hasAlert ? 'bg-red-50/40' : ''}`}
    >
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {hasAlert && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">${spend7d.toLocaleString()}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">{leads7d}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">{appts7d}</td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <span className={`text-sm font-semibold ${cpa7d > 300 ? 'text-red-600' : cpa7d > 200 ? 'text-amber-600' : 'text-green-600'}`}>
          {cpa7d === Infinity || isNaN(cpa7d) ? '—' : `$${cpa7d.toFixed(0)}`}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <span className={`text-sm font-medium ${stl !== null && stl > 15 ? 'text-red-600' : stl !== null && stl > 5 ? 'text-amber-600' : 'text-green-600'}`}>
          {stl === null ? '—' : `${stl.toFixed(0)}m`}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">{showRate7d}</td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {alerts.length > 0 ? (
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">{alerts.length}</span>
        ) : (
          <span className="text-xs text-green-600">✓</span>
        )}
      </td>
      <td className="px-2 py-2.5">
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </td>
    </tr>
  );
}