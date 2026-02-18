import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Copy, Check } from 'lucide-react';

const GOAL_STATUS_CONFIG = {
  behind_wont_meet: { label: "Won't Meet", bg: 'bg-red-100 text-red-700' },
  behind_confident: { label: 'Behind', bg: 'bg-amber-100 text-amber-700' },
  on_track: { label: 'On Track', bg: 'bg-blue-100 text-blue-700' },
  goal_met: { label: 'Goal Met', bg: 'bg-green-100 text-green-700' },
};

const GOAL_TYPE_LABELS = { leads: 'Leads', sets: 'Sets', shows: 'Shows' };

export default function ClientRow({ client, onClick }) {
  const [copied, setCopied] = useState(false);
  const { name, spendCur, leadsCur, apptsCur, cpaCur, cpaChange, stl, showRateCur, alerts } = client;

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(client.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const hasAlert = alerts.length > 0;

  const goalType = client.goal_type;
  const goalValue = client.goal_value;
  const goalActual = client.goalActual;
  const goalStatus = client.effectiveGoalStatus;
  const statusCfg = goalStatus ? GOAL_STATUS_CONFIG[goalStatus] : null;

  const isOverperforming = goalStatus === 'goal_met';

  return (
    <tr
      onClick={onClick}
      className={`group cursor-pointer transition-colors hover:bg-slate-700/20 ${hasAlert ? 'bg-red-500/5' : ''} ${isOverperforming ? 'bg-yellow-500/[0.06]' : ''}`}
      style={isOverperforming ? { boxShadow: 'inset 0 0 20px rgba(234, 179, 8, 0.08), 0 0 8px rgba(234, 179, 8, 0.1)' } : {}}
    >
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {hasAlert && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
          <span className={`text-sm font-medium truncate max-w-[180px] ${isOverperforming ? 'text-yellow-300' : 'text-slate-200'}`}>{name}</span>
          <button
            onClick={handleCopyId}
            title="Copy Client ID"
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-[#D6FF03] transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </td>
      {/* Goal progress */}
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {goalType && goalValue ? (
          <span className="text-xs font-semibold text-slate-300">
            {goalActual ?? 0}/{goalValue} <span className="text-[10px] text-slate-500">{GOAL_TYPE_LABELS[goalType]}</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-600">—</span>
        )}
      </td>
      {/* Goal status */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        {statusCfg ? (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
        ) : (
          <span className="text-[10px] text-slate-600">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-sm text-slate-300 text-right whitespace-nowrap">${spendCur.toLocaleString()}</td>
      <td className="px-3 py-2.5 text-sm text-slate-300 text-right whitespace-nowrap">{leadsCur}</td>
      <td className="px-3 py-2.5 text-sm text-slate-300 text-right whitespace-nowrap">{apptsCur}</td>
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
      <td className="px-3 py-2.5 text-sm text-slate-300 text-right whitespace-nowrap">{showRateCur}</td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {alerts.length > 0 ? (
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">{alerts.length}</span>
        ) : (
          <span className="text-xs text-green-600">✓</span>
        )}
      </td>
      <td className="px-2 py-2.5">
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </td>
    </tr>
  );
}