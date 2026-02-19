import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Pencil, Plus, Filter, DollarSign } from 'lucide-react';

dayjs.extend(isBetween);

const CATEGORY_LABELS = {
  ad_spend: 'Ad Spend', payroll: 'Payroll', software: 'Software',
  office: 'Office', contractor: 'Contractor', travel: 'Travel',
  distribution: 'Distribution', other: 'Other',
};
const CATEGORY_COLORS = {
  ad_spend: 'bg-red-500/15 text-red-400 border-red-500/30',
  payroll: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  software: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  office: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  contractor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  travel: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const TYPE_LABELS = { cogs: 'COGS', overhead: 'Overhead' };
const TYPE_COLORS = {
  cogs: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  overhead: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function ExpenseManager({ expenses, clients, startDate, endDate, onRefresh, onAddExpense }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');

  const filtered = useMemo(() => {
    return expenses
      .filter(e => e.date && dayjs(e.date).isBetween(start, end, null, '[]'))
      .filter(e => filterCat === 'all' || e.category === filterCat)
      .filter(e => filterType === 'all' || e.expense_type === filterType)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, startDate, endDate, filterCat, filterType]);

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const cogsTotal = filtered.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
  const overheadTotal = filtered.filter(e => e.expense_type !== 'cogs' && e.category !== 'distribution').reduce((s, e) => s + (e.amount || 0), 0);
  const distTotal = filtered.filter(e => e.category === 'distribution').reduce((s, e) => s + (e.amount || 0), 0);

  // Category breakdown
  const byCat = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const cat = e.category || 'other';
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const getClientName = (id) => clients.find(c => c.id === id)?.name || '';

  const handleDelete = async (id) => {
    await base44.entities.Expense.delete(id);
    toast({ title: 'Expense Deleted', variant: 'success' });
    onRefresh();
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditData({
      category: e.category || 'other',
      expense_type: e.expense_type || 'overhead',
      description: e.description || '',
      amount: e.amount || 0,
      date: e.date || '',
      vendor: e.vendor || '',
      recurring: e.recurring || false,
      client_id: e.client_id || '',
    });
  };

  const saveEdit = async () => {
    if (!editData.amount || !editData.date) return;
    setSavingEdit(true);
    await base44.entities.Expense.update(editingId, {
      ...editData,
      amount: Number(editData.amount),
      client_id: editData.client_id || undefined,
    });
    setSavingEdit(false);
    setEditingId(null);
    toast({ title: 'Expense Updated', variant: 'success' });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Expenses" value={total} color="text-red-400" bg="bg-red-500/10" />
        <SummaryCard label="COGS" value={cogsTotal} color="text-orange-400" bg="bg-orange-500/10" />
        <SummaryCard label="Overhead" value={overheadTotal} color="text-slate-300" bg="bg-slate-500/10" />
        <SummaryCard label="Distributions" value={distTotal} color="text-emerald-400" bg="bg-emerald-500/10" subtitle="Excluded from P&L" />
      </div>

      {/* Category breakdown bar */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">By Category</h3>
        <div className="space-y-2">
          {byCat.map(([cat, amt]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}`}>
                {CATEGORY_LABELS[cat] || cat}
              </span>
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
                  style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white w-20 text-right">${amt.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 w-10 text-right">{total > 0 ? ((amt / total) * 100).toFixed(0) : 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Add button */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
        >
          <option value="all">All Types</option>
          <option value="cogs">COGS</option>
          <option value="overhead">Overhead</option>
        </select>
        <div className="flex-1" />
        <span className="text-xs text-slate-500">{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</span>
        <button
          onClick={onAddExpense}
          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Expense
        </button>
      </div>

      {/* Expense table */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400">
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Description</th>
                <th className="text-left px-3 py-2 font-medium">Vendor</th>
                <th className="text-left px-3 py-2 font-medium">Client</th>
                <th className="text-right px-3 py-2 font-medium">Amount</th>
                <th className="text-center px-3 py-2 font-medium w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">No expenses match your filters</td>
                </tr>
              ) : filtered.map(e => editingId === e.id ? (
                <tr key={e.id} className="bg-slate-700/30">
                  <td className="px-3 py-2">
                    <input type="date" value={editData.date} onChange={ev => setEditData({ ...editData, date: ev.target.value })} className="w-full px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={editData.category} onChange={ev => setEditData({ ...editData, category: ev.target.value })} className="px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white">
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={editData.expense_type} onChange={ev => setEditData({ ...editData, expense_type: ev.target.value })} className="px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white">
                      <option value="cogs">COGS</option>
                      <option value="overhead">Overhead</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input value={editData.description} onChange={ev => setEditData({ ...editData, description: ev.target.value })} className="w-full px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={editData.vendor} onChange={ev => setEditData({ ...editData, vendor: ev.target.value })} className="w-full px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={editData.client_id} onChange={ev => setEditData({ ...editData, client_id: ev.target.value })} className="px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white">
                      <option value="">None</option>
                      {clients.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={editData.amount} onChange={ev => setEditData({ ...editData, amount: ev.target.value })} className="w-full px-1.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white text-right" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={saveEdit} disabled={savingEdit} className="px-2 py-1 text-[10px] font-medium bg-[#D6FF03] text-black rounded hover:bg-[#c2e600]">
                        {savingEdit ? '...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-white">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={e.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 py-2 text-slate-300">{dayjs(e.date).format('MMM D, YYYY')}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>
                      {CATEGORY_LABELS[e.category] || e.category}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${TYPE_COLORS[e.expense_type] || TYPE_COLORS.overhead}`}>
                      {TYPE_LABELS[e.expense_type] || 'OH'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white">{e.description || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">{e.vendor || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">{e.client_id ? getClientName(e.client_id) : '—'}</td>
                  <td className="px-3 py-2 text-right font-bold text-red-400">${(e.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => startEdit(e)} className="p-1 text-slate-500 hover:text-blue-400 transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, bg, subtitle }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
      <p className="text-[9px] font-medium text-slate-400 uppercase mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>${value.toLocaleString()}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}