import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BILLING_COLORS = {
  pay_per_show: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pay_per_set: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  retainer: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const BILLING_LABELS = {
  pay_per_show: 'Per Show',
  pay_per_set: 'Per Set',
  retainer: 'Retainer',
  hybrid: 'Hybrid',
};

const COLUMNS = [
  { key: 'client_name', label: 'Client', align: 'left' },
  { key: 'billing_type', label: 'Type', align: 'left' },
  { key: 'revenue', label: 'Revenue', align: 'right' },
  { key: 'clientCosts', label: 'Client Costs', align: 'right' },
  { key: 'sharedCogs', label: 'Shared COGS', align: 'right' },
  { key: 'sharedOverhead', label: 'Shared OH', align: 'right' },
  { key: 'editingCosts', label: 'Editing', align: 'right' },
  { key: 'netProfit', label: 'Net Profit', align: 'right' },
  { key: 'margin', label: 'Margin', align: 'right' },
];

function fmt(v) {
  if (v == null) return '$0';
  const neg = v < 0;
  const abs = Math.abs(v);
  const str = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
  return neg ? `-${str}` : str;
}

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#D6FF03]" /> : <ArrowDown className="w-3 h-3 text-[#D6FF03]" />;
}

export default function ProfitabilityTable({ clients }) {
  const [sortKey, setSortKey] = useState('netProfit');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    if (!clients?.length) return [];
    return [...clients].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal == null) aVal = -Infinity;
      if (bVal == null) bVal = -Infinity;
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [clients, sortKey, sortDir]);

  if (!clients?.length) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-12 text-center">
        <p className="text-slate-400 text-sm">No client data for this period.</p>
        <p className="text-slate-500 text-xs mt-1">Try selecting a different date range.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-3 text-xs font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => {
              const profitColor = c.netProfit > 0 ? 'text-green-400' : c.netProfit < 0 ? 'text-red-400' : 'text-slate-400';
              const marginColor = c.margin == null ? 'text-slate-500' :
                c.margin >= 20 ? 'text-green-400' :
                c.margin >= 0 ? 'text-yellow-400' : 'text-red-400';

              return (
                <tr key={c.client_id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link
                      to={createPageUrl('ClientView') + `?id=${c.client_id}`}
                      className="text-white font-medium hover:text-[#D6FF03] transition-colors"
                    >
                      {c.client_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={`text-[10px] font-semibold border ${BILLING_COLORS[c.billing_type] || 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                      {BILLING_LABELS[c.billing_type] || c.billing_type || '—'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-200 font-medium">{fmt(c.revenue)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{fmt(c.clientCosts)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{fmt(c.sharedCogs)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{fmt(c.sharedOverhead)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{fmt(c.editingCosts)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${profitColor}`}>{fmt(c.netProfit)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${marginColor}`}>
                    {c.margin != null ? `${c.margin.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}