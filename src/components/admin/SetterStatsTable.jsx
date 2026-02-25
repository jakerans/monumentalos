import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Timer, Calendar, Target, Ban, TrendingUp } from 'lucide-react';

const DQ_LABELS = {
  looking_for_work: 'Looking For Work',
  not_interested: 'Not Interested',
  wrong_invalid_number: 'Wrong/Invalid #',
  project_size: 'Project Size',
  oosa: 'OOSA',
  client_availability: 'Client Avail.',
};

function STLBadge({ value }) {
  if (value == null) return <span className="text-slate-600">—</span>;
  const color = value <= 5 ? 'text-green-400 bg-green-500/10' : value <= 15 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{value}m</span>;
}

function DQBreakdownRow({ dqReasons }) {
  const total = Object.values(dqReasons).reduce((a, b) => a + b, 0);
  if (total === 0) return <span className="text-slate-600 text-xs">None</span>;
  const sorted = Object.entries(dqReasons).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(([reason, count]) => (
        <span key={reason} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
          {DQ_LABELS[reason] || reason}: <span className="font-bold text-white">{count}</span>
        </span>
      ))}
    </div>
  );
}

export default function SetterStatsTable({ stats }) {
  const [sortKey, setSortKey] = useState('booked');
  const [sortDir, setSortDir] = useState(-1);
  const [expandedId, setExpandedId] = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  };

  const sorted = [...stats].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null;
    return sortDir === 1 ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const thClass = "text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2.5 text-left cursor-pointer hover:text-slate-300 transition-colors whitespace-nowrap";
  const tdClass = "px-3 py-3 text-sm";

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className={`${thClass} w-8`}>#</th>
              <th className={thClass}>Setter</th>
              <th className={thClass} onClick={() => handleSort('firstCalls')}>Calls <SortIcon col="firstCalls" /></th>
              <th className={thClass} onClick={() => handleSort('booked')}>Booked <SortIcon col="booked" /></th>
              <th className={thClass} onClick={() => handleSort('showed')}>Showed <SortIcon col="showed" /></th>
              <th className={thClass} onClick={() => handleSort('dq')}>DQ <SortIcon col="dq" /></th>
              <th className={thClass} onClick={() => handleSort('avgSTL')}>Avg STL <SortIcon col="avgSTL" /></th>
              <th className={thClass} onClick={() => handleSort('showRate')}>Show % <SortIcon col="showRate" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <React.Fragment key={s.id}>
                <tr
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className={`border-b border-slate-700/20 cursor-pointer transition-colors ${expandedId === s.id ? 'bg-slate-700/20' : 'hover:bg-slate-700/10'}`}
                >
                  <td className={`${tdClass} text-slate-500 font-mono text-xs`}>{i + 1}</td>
                  <td className={`${tdClass} font-medium text-white`}>{s.name}</td>
                  <td className={`${tdClass} text-slate-300`}>{s.firstCalls}</td>
                  <td className={`${tdClass} text-purple-400 font-semibold`}>{s.booked}</td>
                  <td className={`${tdClass} text-green-400 font-semibold`}>{s.showed}</td>
                  <td className={`${tdClass} text-red-400 font-semibold`}>{s.dq}</td>
                  <td className={tdClass}><STLBadge value={s.avgSTL} /></td>
                  <td className={`${tdClass} text-emerald-400`}>{s.showRate != null ? `${s.showRate}%` : '—'}</td>
                </tr>
                {expandedId === s.id && (
                  <tr className="bg-slate-800/60">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">DQ Reasons Breakdown</p>
                          <DQBreakdownRow dqReasons={s.dqReasons} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">STL Distribution</p>
                          <div className="flex gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">≤5m: <b>{s.stlUnder5}</b></span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">5-15m: <b>{s.stl5to15}</b></span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">&gt;15m: <b>{s.stlOver15}</b></span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Conversion Funnel</p>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-amber-400">{s.firstCalls} calls</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-purple-400">{s.booked} booked</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-green-400">{s.showed} showed</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">No setter data for this period</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}