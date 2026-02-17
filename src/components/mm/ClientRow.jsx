import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function ClientRow({ client, onClick }) {
  const { name, spendCur, leadsCur, apptsCur, cpaCur, cpaChange, stl, showRateCur, alerts } = client;
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
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">${spendCur.toLocaleString()}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">{leadsCur}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">{apptsCur}</td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <div className="flex flex-col items-end">
          <span className={`text-sm font-semibold ${cpaCur > 300 ? 'text-red-600' : cpaCur > 200 ? 'text-amber-600' : 'text-green-600'}`}>
            {cpaCur === Infinity || isNaN(cpaCur) ? '—' : `$${cpaCur.toFixed(0)}`}
          </span>
          {cpaChange != null && (
            <span className={`text-[10px] font-medium ${cpaChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {cpaChange > 0 ? '▲' : '▼'}{Math.abs(cpaChange).toFixed(0)}%
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <span className={`text-sm font-medium ${stl !== null && stl > 15 ? 'text-red-600' : stl !== null && stl > 5 ? 'text-amber-600' : 'text-green-600'}`}>
          {stl === null ? '—' : `${stl.toFixed(0)}m`}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-700 text-right whitespace-nowrap">{showRateCur}</td>
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