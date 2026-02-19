import React from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

dayjs.extend(isBetween);

const CATEGORY_LABELS = {
  ad_spend: 'Ad Spend', payroll: 'Payroll', software: 'Software',
  office: 'Office', contractor: 'Contractor', travel: 'Travel', distribution: 'Distribution', other: 'Other',
};
const CATEGORY_COLORS = {
  ad_spend: 'bg-red-100 text-red-700', payroll: 'bg-blue-100 text-blue-700',
  software: 'bg-purple-100 text-purple-700', office: 'bg-amber-100 text-amber-700',
  contractor: 'bg-indigo-100 text-indigo-700', travel: 'bg-teal-100 text-teal-700',
  distribution: 'bg-emerald-100 text-emerald-700', other: 'bg-gray-100 text-gray-700',
};
const TYPE_COLORS = { cogs: 'bg-orange-100 text-orange-700', overhead: 'bg-gray-100 text-gray-700' };

export default function ExpenseBreakdown({ expenses, clients, startDate, endDate, onRefresh }) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const filtered = expenses.filter(e => e.date && dayjs(e.date).isBetween(start, end, null, '[]'));

  // Group by category
  const byCat = {};
  filtered.forEach(e => {
    const cat = e.category || 'other';
    byCat[cat] = (byCat[cat] || 0) + (e.amount || 0);
  });
  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const handleDelete = async (id) => {
    await base44.entities.Expense.delete(id);
    onRefresh();
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Expense Breakdown</h2>
        <span className="text-sm font-bold text-red-600">Total: ${total.toLocaleString()}</span>
      </div>
      {/* COGS vs Overhead summary */}
      <div className="px-4 py-2 flex gap-3 border-b border-slate-700/30">
        <div className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
          COGS: ${filtered.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}
        </div>
        <div className="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-700">
          Overhead: ${filtered.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}
        </div>
      </div>
      {/* Category summary */}
      <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-slate-700/30">
        {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
          <div key={cat} className={`px-2 py-1 rounded text-xs font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}>
            {CATEGORY_LABELS[cat] || cat}: ${amt.toLocaleString()}
          </div>
        ))}
      </div>
      {/* Detail list */}
      <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-700/30">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-500 text-center">No expenses in this period</div>
        ) : filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
          <div key={e.id} className="px-4 py-2 flex items-center justify-between hover:bg-slate-700/20">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex-shrink-0 ${TYPE_COLORS[e.expense_type] || TYPE_COLORS.overhead}`}>
                {e.expense_type === 'cogs' ? 'COGS' : 'OH'}
              </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex-shrink-0 ${CATEGORY_COLORS[e.category] || 'bg-gray-100 text-gray-600'}`}>
                {CATEGORY_LABELS[e.category] || e.category}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{e.description || '—'}</p>
                <p className="text-[10px] text-slate-500">{e.date} · {e.vendor || '—'}{e.client_id ? ` · ${getClientName(e.client_id)}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-red-600">${e.amount?.toLocaleString()}</span>
              <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}