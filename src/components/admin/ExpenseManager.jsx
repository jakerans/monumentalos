import React, { useState, useCallback, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Plus, Filter, ChevronLeft, ChevronRight, Check, X, Sparkles, CheckCircle, ArrowUp, ArrowDown, ArrowUpDown, Square, CheckSquare, Loader2, Search } from 'lucide-react';
import ExpenseTabSkeleton from './ExpenseTabSkeleton';
import DuplicateExpenseFinder from './DuplicateExpenseFinder';
import ExpenseToolbar from './ExpenseToolbar';

const CATEGORY_LABELS = {
  ad_spend: 'Ad Spend', payroll: 'Payroll', software: 'Software',
  office: 'Office', contractor: 'Contractor', travel: 'Travel',
  processing_fee: 'Processing Fee', other: 'Other',
};
const CATEGORY_COLORS = {
  ad_spend: 'bg-red-500/15 text-red-400 border-red-500/30',
  payroll: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  software: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  office: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  contractor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  travel: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  processing_fee: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const TYPE_LABELS = { cogs: 'COGS', overhead: 'Overhead' };
const TYPE_COLORS = {
  cogs: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  overhead: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const PAGE_SIZE = 50;

export default function ExpenseManager({ startDate, endDate, onAddExpense }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expenses-table', startDate, endDate, filterCat, filterType, page, sortField, sortDir, debouncedSearch],
    queryFn: async () => {
      const res = await base44.functions.invoke('getExpensesTableData', {
        startDate,
        endDate,
        filterCat,
        filterType,
        search: debouncedSearch,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        sortField,
        sortDir,
      });
      return res.data;
    },
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const kpis = data?.kpis || { total: 0, cogsTotal: 0, overheadTotal: 0 };
  const byCategory = data?.byCategory || [];
  const expenses = data?.expenses || [];
  const totalFiltered = data?.totalFiltered || 0;
  const filteredTotal = data?.filteredTotal || 0;
  const clients = data?.clients || [];
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'amount' ? 'desc' : 'asc');
    }
    setPage(0);
  };

  // Clear selection when page/filters change
  useEffect(() => { setSelected(new Set()); setSelectAllMode(null); }, [page, filterCat, filterType, startDate, endDate]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const [selectAllMode, setSelectAllMode] = useState(null); // null | 'page' | 'all'

  const toggleSelectAll = () => {
    if (selected.size === expenses.length) {
      setSelected(new Set());
      setSelectAllMode(null);
    } else {
      setSelected(new Set(expenses.map(e => e.id)));
      setSelectAllMode('page');
    }
  };
  const allSelected = expenses.length > 0 && selected.size === expenses.length;

  const handleSelectAllFiltered = async () => {
    // Fetch all IDs across all pages for current filters
    const res = await base44.functions.invoke('getExpensesTableData', {
      startDate, endDate, filterCat, filterType, skip: 0, limit: 999999, sortField, sortDir,
    });
    const allIds = (res.data?.expenses || []).map(e => e.id);
    setSelected(new Set(allIds));
    setSelectAllMode('all');
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} expense${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const ids = [...selected];
    const CHUNK = 10;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      await base44.functions.invoke('bulkDeleteExpenses', { ids: chunk });
    }
    toast({ title: `${ids.length} Expense${ids.length > 1 ? 's' : ''} Deleted`, variant: 'success' });
    setSelected(new Set());
    setSelectAllMode(null);
    setBulkDeleting(false);
    refetch();
  };

  const handleFilterChange = useCallback((setter, value) => {
    setter(value);
    setPage(0);
  }, []);

  const handleDelete = async (id) => {
    await base44.entities.Expense.delete(id);
    toast({ title: 'Expense Deleted', variant: 'success' });
    refetch();
  };

  const handleInlineUpdate = async (id, field, value) => {
    const update = { [field]: field === 'amount' ? Number(value) : value };
    if (field === 'client_id' && !value) update.client_id = undefined;
    await base44.entities.Expense.update(id, update);
    toast({ title: 'Updated', variant: 'success' });
    refetch();
  };

  const handleApproveAI = async (expense) => {
    await base44.entities.Expense.update(expense.id, {
      category: expense.suggested_category,
      expense_type: expense.suggested_type,
      ai_approved: true,
      suggested_category: expense.suggested_category,
      suggested_type: expense.suggested_type,
    });
    toast({ title: 'AI suggestion approved', variant: 'success' });
    refetch();
  };

  if (isLoading && !data) return <ExpenseTabSkeleton />;

  const pageSwitching = isFetching && !!data;

  return (
    <div className="space-y-4">
      {/* Sync + AI buttons */}
      <ExpenseToolbar onRefresh={refetch} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Expenses" value={kpis.total} color="text-red-400" />
        <SummaryCard label="COGS" value={kpis.cogsTotal} color="text-orange-400" />
        <SummaryCard label="Overhead" value={kpis.overheadTotal} color="text-slate-300" />
      </div>

      {/* Duplicate finder */}
      <DuplicateExpenseFinder onCleanupDone={refetch} />

      {/* Category breakdown */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">By Category</h3>
        <div className="space-y-2">
          {byCategory.map(({ category, amount }) => (
            <div key={category} className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded border min-w-[70px] text-center ${CATEGORY_COLORS[category] || CATEGORY_COLORS.other}`}>
                {CATEGORY_LABELS[category] || category}
              </span>
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full" style={{ width: `${kpis.total > 0 ? (amount / kpis.total) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-white w-20 text-right">${amount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 w-10 text-right">{kpis.total > 0 ? ((amount / kpis.total) * 100).toFixed(0) : 0}%</span>
            </div>
          ))}
          {byCategory.length === 0 && <p className="text-xs text-slate-500">No expenses in this period</p>}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-red-400">{selected.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
            <button onClick={() => { setSelected(new Set()); setSelectAllMode(null); }} className="text-xs text-slate-400 hover:text-white ml-auto">Clear</button>
          </div>
          {selectAllMode === 'page' && totalFiltered > expenses.length && (
            <div className="text-xs text-slate-400">
              All {expenses.length} on this page selected.{' '}
              <button onClick={handleSelectAllFiltered} className="text-[#D6FF03] hover:underline font-medium">
                Select all {totalFiltered} expenses matching filters
              </button>
            </div>
          )}
          {selectAllMode === 'all' && (
            <div className="text-xs text-[#D6FF03]">
              All {selected.size} expenses matching filters are selected.
            </div>
          )}
        </div>
      )}

      {/* Search + Filters + Add */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, vendor, or client..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select value={filterCat} onChange={e => handleFilterChange(setFilterCat, e.target.value)} className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50">
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterType} onChange={e => handleFilterChange(setFilterType, e.target.value)} className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50">
            <option value="all">All Types</option>
            <option value="cogs">COGS</option>
            <option value="overhead">Overhead</option>
          </select>
          <div className="flex-1" />
          <span className="text-xs text-slate-500">
            {totalFiltered} expense{totalFiltered !== 1 ? 's' : ''}
            {filterCat !== 'all' || filterType !== 'all' || debouncedSearch ? ` · $${filteredTotal.toLocaleString()}` : ''}
          </span>
          <button onClick={onAddExpense} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </button>
        </div>
      </div>

      {/* Mobile card view */}
      <div className={`sm:hidden space-y-2 relative ${pageSwitching ? 'opacity-60' : ''}`}>
        {pageSwitching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30 rounded-lg">
            <div className="w-5 h-5 border-2 border-[#D6FF03]/40 border-t-[#D6FF03] rounded-full animate-spin" />
          </div>
        )}
        {expenses.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 px-4 py-8 text-center text-slate-500 text-xs">No expenses match your filters</div>
        ) : expenses.map(e => {
          const hasPendingAI = !e.ai_approved && e.suggested_category;
          const isSelected = selected.has(e.id);
          return (
            <div key={e.id} className={`bg-slate-800/50 rounded-lg border border-slate-700/50 px-3 py-3 space-y-2 ${hasPendingAI ? 'border-l-2 border-l-yellow-500/50' : ''} ${isSelected ? 'ring-1 ring-red-500/50' : ''}`}>
              <div className="flex items-center justify-between">
                <button onClick={() => toggleSelect(e.id)} className="mr-2 shrink-0">
                  {isSelected ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                </button>
                <span className="text-xs font-medium text-white truncate flex-1">{e.description || '—'}</span>
                <span className="text-sm font-bold text-red-400 ml-2">${(e.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${CATEGORY_COLORS[hasPendingAI ? e.suggested_category : e.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_LABELS[hasPendingAI ? e.suggested_category : e.category] || (hasPendingAI ? e.suggested_category : e.category)}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${TYPE_COLORS[hasPendingAI ? e.suggested_type : e.expense_type] || TYPE_COLORS.overhead}`}>
                  {TYPE_LABELS[hasPendingAI ? e.suggested_type : e.expense_type] || 'OH'}
                </span>
                {hasPendingAI && <span className="px-1 py-0.5 text-[8px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">AI</span>}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{dayjs(e.date).format('MMM D, YYYY')}{e.vendor ? ` · ${e.vendor}` : ''}</span>
                <div className="flex items-center gap-1">
                  {hasPendingAI && <button onClick={() => handleApproveAI(e)} className="p-1 text-yellow-500 hover:text-green-400"><CheckCircle className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => handleDelete(e.id)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1 py-2">
            <span className="text-[10px] text-slate-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className={`hidden sm:block bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden relative ${pageSwitching ? 'opacity-60' : ''}`}>
        {pageSwitching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30">
            <div className="w-5 h-5 border-2 border-[#D6FF03]/40 border-t-[#D6FF03] rounded-full animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '36px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '95px' }} />
              <col style={{ width: '85px' }} />
              <col />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '70px' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400">
                <th className="px-2 py-2 text-center">
                  <button onClick={toggleSelectAll} className="inline-flex">
                    {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-red-400" /> : <Square className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />}
                  </button>
                </th>
                <SortableHeader field="date" label="Date" current={sortField} dir={sortDir} onClick={handleSort} />
                <SortableHeader field="category" label="Category" current={sortField} dir={sortDir} onClick={handleSort} />
                <SortableHeader field="expense_type" label="Type" current={sortField} dir={sortDir} onClick={handleSort} />
                <th className="text-left px-3 py-2 font-medium">Description</th>
                <SortableHeader field="vendor" label="Vendor" current={sortField} dir={sortDir} onClick={handleSort} />
                <SortableHeader field="client_id" label="Client" current={sortField} dir={sortDir} onClick={handleSort} />
                <SortableHeader field="amount" label="Amount" current={sortField} dir={sortDir} onClick={handleSort} align="right" />
                <th className="text-center px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {expenses.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">No expenses match your filters</td></tr>
              ) : expenses.map(e => (
                <ExpenseRow key={e.id} expense={e} clients={clients} onUpdate={handleInlineUpdate} onDelete={() => handleDelete(e.id)} onApproveAI={handleApproveAI} selected={selected.has(e.id)} onToggleSelect={() => toggleSelect(e.id)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  
  );
}

function SummaryCard({ label, value, color, subtitle }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
      <p className="text-[9px] font-medium text-slate-400 uppercase mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>${(value || 0).toLocaleString()}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function InlineEditCell({ value, displayValue, field, expenseId, onUpdate, type = 'text', options, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setLocalVal(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    if (localVal !== value) onUpdate(expenseId, field, localVal);
    setEditing(false);
  };
  const cancel = () => { setLocalVal(value); setEditing(false); };
  const onKey = (ev) => { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') cancel(); };

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className={`cursor-pointer rounded px-1 -mx-1 hover:bg-slate-600/30 transition-colors ${className}`}>
        {displayValue}
      </div>
    );
  }

  if (options) {
    return (
      <select ref={inputRef} value={localVal} onChange={ev => { const v = ev.target.value; setLocalVal(v); onUpdate(expenseId, field, v); setEditing(false); }} onBlur={() => setEditing(false)} className="w-full min-w-0 px-1 py-0.5 text-xs bg-slate-900 border border-[#D6FF03]/50 rounded text-white outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  return (
    <input ref={inputRef} type={type} value={localVal} onChange={ev => setLocalVal(ev.target.value)} onBlur={save} onKeyDown={onKey} className={`w-full min-w-0 px-1 py-0.5 text-xs bg-slate-900 border border-[#D6FF03]/50 rounded text-white outline-none ${type === 'number' ? 'text-right' : ''}`} />
  );
}

function SortableHeader({ field, label, current, dir, onClick, align = 'left' }) {
  const active = current === field;
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      className={`text-${align} px-3 py-2 font-medium cursor-pointer select-none hover:text-white transition-colors ${active ? 'text-[#D6FF03]' : ''}`}
      onClick={() => onClick(field)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end w-full' : ''}`}>
        {label}
        <Icon className={`w-3 h-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </span>
    </th>
  );
}

function ExpenseRow({ expense: e, clients, onUpdate, onDelete, onApproveAI, selected, onToggleSelect }) {
  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));
  const typeOptions = [{ value: 'cogs', label: 'COGS' }, { value: 'overhead', label: 'Overhead' }];
  const clientOptions = [{ value: '', label: 'None' }, ...clients.map(c => ({ value: c.id, label: c.name }))];

  const hasPendingAI = !e.ai_approved && e.suggested_category;

  return (
    <tr className={`hover:bg-slate-700/20 transition-colors group ${hasPendingAI ? 'bg-yellow-500/8 border-l-2 border-l-yellow-500/50' : ''} ${selected ? 'bg-red-500/5' : ''}`}>
      <td className="px-2 py-2 text-center">
        <button onClick={onToggleSelect}>
          {selected ? <CheckSquare className="w-3.5 h-3.5 text-red-400" /> : <Square className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />}
        </button>
      </td>
      <td className="px-3 py-2 text-slate-300">
        <InlineEditCell value={e.date || ''} displayValue={dayjs(e.date).format('MMM D, YYYY')} field="date" expenseId={e.id} onUpdate={onUpdate} type="date" />
      </td>
      <td className="px-3 py-2">
        {hasPendingAI ? (
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border italic ${CATEGORY_COLORS[e.suggested_category] || CATEGORY_COLORS.other}`}>
              {CATEGORY_LABELS[e.suggested_category] || e.suggested_category}
            </span>
            <span className="px-1 py-0.5 text-[8px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">AI</span>
          </div>
        ) : (
          <InlineEditCell value={e.category || 'other'} displayValue={<span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>{CATEGORY_LABELS[e.category] || e.category}</span>} field="category" expenseId={e.id} onUpdate={onUpdate} options={categoryOptions} />
        )}
      </td>
      <td className="px-3 py-2">
        {hasPendingAI ? (
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border italic ${TYPE_COLORS[e.suggested_type] || TYPE_COLORS.overhead}`}>
              {TYPE_LABELS[e.suggested_type] || e.suggested_type}
            </span>
            <span className="px-1 py-0.5 text-[8px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">AI</span>
          </div>
        ) : (
          <InlineEditCell value={e.expense_type || 'overhead'} displayValue={<span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${TYPE_COLORS[e.expense_type] || TYPE_COLORS.overhead}`}>{TYPE_LABELS[e.expense_type] || 'OH'}</span>} field="expense_type" expenseId={e.id} onUpdate={onUpdate} options={typeOptions} />
        )}
      </td>
      <td className="px-3 py-2 text-white">
        <InlineEditCell value={e.description || ''} displayValue={<span className="truncate block">{e.description || '—'}</span>} field="description" expenseId={e.id} onUpdate={onUpdate} />
      </td>
      <td className="px-3 py-2 text-slate-400">
        <InlineEditCell value={e.vendor || ''} displayValue={<span className="truncate block">{e.vendor || '—'}</span>} field="vendor" expenseId={e.id} onUpdate={onUpdate} />
      </td>
      <td className="px-3 py-2 text-slate-400">
        <InlineEditCell value={e.client_id || ''} displayValue={<span className="truncate block">{e.client_name || '—'}</span>} field="client_id" expenseId={e.id} onUpdate={onUpdate} options={clientOptions} />
      </td>
      <td className="px-3 py-2 text-right font-bold text-red-400">
        <InlineEditCell value={e.amount || 0} displayValue={`$${(e.amount || 0).toLocaleString()}`} field="amount" expenseId={e.id} onUpdate={onUpdate} type="number" className="text-right" />
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {hasPendingAI && (
            <button onClick={() => onApproveAI(e)} title="Approve AI suggestion" className="p-1 text-yellow-500 hover:text-green-400 transition-all">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onDelete} className="p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
        </div>
      </td>
    </tr>
  );
}