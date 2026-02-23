import React, { useState, useCallback, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Plus, Filter, ChevronLeft, ChevronRight, Check, X, Sparkles, CheckCircle, ArrowUp, ArrowDown, ArrowUpDown, Square, CheckSquare, Loader2, Search, AlertTriangle, ChevronDown, RotateCcw, Undo2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ExpenseTabSkeleton from './ExpenseTabSkeleton';
import DuplicateExpenseFinder from './DuplicateExpenseFinder';
import ExpenseToolbar from './ExpenseToolbar';

const CATEGORY_LABELS = {
  uncategorized: 'Uncategorized',
  ad_spend: 'Ad Spend', payroll: 'Payroll', software: 'Software',
  office: 'Office', contractor: 'Contractor', travel: 'Travel',
  distribution: 'Distribution', processing_fee: 'Processing Fee', other: 'Other',
};
const CATEGORY_COLORS = {
  uncategorized: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ad_spend: 'bg-red-500/15 text-red-400 border-red-500/30',
  payroll: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  software: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  office: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  contractor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  travel: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  processing_fee: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const TYPE_LABELS = { uncategorized: 'Uncategorized', cogs: 'COGS', overhead: 'Overhead', distribution: 'Distribution' };
const TYPE_COLORS = {
  uncategorized: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  cogs: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  overhead: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const PAGE_SIZE = 50;

function RefundModal({ expense, open, onClose, onRefunded }) {
  const [mode, setMode] = useState('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && expense) {
      setMode('full');
      setRefundAmount('');
    }
  }, [open, expense?.id]);

  if (!open || !expense) return null;

  const handleSave = async () => {
    setSaving(true);
    const amount = mode === 'full' ? expense.amount : parseFloat(refundAmount);
    if (!amount || amount <= 0 || amount > expense.amount) {
      setSaving(false);
      return;
    }
    await base44.entities.Expense.update(expense.id, {
      is_refunded: mode === 'full',
      refund_amount: amount,
    });
    setSaving(false);
    onRefunded();
    onClose();
  };

  const partialAmt = parseFloat(refundAmount);
  const partialValid = !isNaN(partialAmt) && partialAmt > 0 && partialAmt <= expense.amount;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-900 border border-slate-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as Refunded</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                {expense.description || 'Expense'} — ${(expense.amount || 0).toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('full')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                    mode === 'full'
                      ? 'bg-[#D6FF03]/15 border-[#D6FF03]/40 text-[#D6FF03]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Full Refund
                </button>
                <button
                  onClick={() => setMode('partial')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                    mode === 'partial'
                      ? 'bg-[#D6FF03]/15 border-[#D6FF03]/40 text-[#D6FF03]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Partial Refund
                </button>
              </div>
              {mode === 'partial' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Refund Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(ev) => setRefundAmount(ev.target.value)}
                      max={expense.amount}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
                    />
                  </div>
                  {refundAmount && !partialValid && parseFloat(refundAmount) > expense.amount && (
                    <p className="text-[10px] text-red-400 mt-1">Refund cannot exceed original amount</p>
                  )}
                </div>
              )}
              {mode === 'full' && (
                <p className="text-xs text-slate-500">This marks the full ${(expense.amount || 0).toLocaleString()} as refunded. The expense stays in your records but is excluded from totals.</p>
              )}
              {mode === 'partial' && partialValid && (
                <p className="text-xs text-slate-500">Effective amount after refund: ${((expense.amount || 0) - partialAmt).toLocaleString()}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSave}
            disabled={saving || (mode === 'partial' && !partialValid)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? 'Saving...' : 'Mark as Refunded'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ExpenseManager({ startDate, endDate, onAddExpense }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showDistributions, setShowDistributions] = useState(false);
  const [refundExpense, setRefundExpense] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  // Shape: { title, description, variant, onConfirm }

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts-expense-manager'],
    queryFn: () => base44.entities.BankAccount.list('-created_date'),
    staleTime: 5 * 60 * 1000,
  });
  const bankAccountMap = Object.fromEntries(bankAccounts.map(a => [a.id, a.name]));

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expenses-table', startDate, endDate, filterCat, filterType, page, sortField, sortDir, debouncedSearch, showDistributions, filterAccount],
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
        showDistributions,
        filterAccount,
      });
      return res.data;
    },
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const kpis = data?.kpis || { total: 0, cogsTotal: 0, overheadTotal: 0, uncategorizedCount: 0, aiPendingCount: 0 };
  const uncategorizedCount = kpis.uncategorizedCount || 0;
  const aiPendingCount = kpis.aiPendingCount || 0;
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
  useEffect(() => { setSelected(new Set()); setSelectAllMode(null); }, [page, filterCat, filterType, filterAccount, startDate, endDate]);

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

  const handleApproveAllAI = () => {
    setConfirmAction({
      title: 'Approve All AI Categories',
      description: `Mark all ${aiPendingCount} AI-categorized expenses as reviewed? You can still edit individual expenses afterward.`,
      variant: 'success',
      onConfirm: async () => {
        const res = await base44.functions.invoke('bulkApproveAIExpenses', {});
        const d = res.data;
        toast({ title: 'AI Categories Approved', description: `${d.approved || 0} expenses marked as reviewed`, variant: 'success' });
        refetch();
      },
    });
  };

  const handleBulkApprove = () => {
    const ids = [...selected];
    setConfirmAction({
      title: 'Approve Selected Expenses',
      description: `Mark ${ids.length} expense${ids.length > 1 ? 's' : ''} as reviewed and approved?`,
      variant: 'success',
      onConfirm: async () => {
        const CHUNK = 10;
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          await Promise.all(chunk.map(id =>
            base44.entities.Expense.update(id, { ai_approved: true, suggested_category: '', suggested_type: '' })
          ));
        }
        toast({ title: `${ids.length} Expense${ids.length > 1 ? 's' : ''} Approved`, variant: 'success' });
        setSelected(new Set());
        setSelectAllMode(null);
        refetch();
      },
    });
  };

  const handleBulkUpdate = (field, value) => {
    const ids = [...selected];
    const fieldLabel = field === 'category' ? 'category' : 'type';
    setConfirmAction({
      title: `Update ${fieldLabel}`,
      description: `Set ${fieldLabel} to "${value}" for ${ids.length} expense${ids.length > 1 ? 's' : ''}?`,
      variant: 'default',
      onConfirm: async () => {
        const CHUNK = 10;
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          await Promise.all(chunk.map(id => base44.entities.Expense.update(id, { [field]: value })));
        }
        toast({ title: `${ids.length} Expense${ids.length > 1 ? 's' : ''} Updated`, variant: 'success' });
        setSelected(new Set());
        setSelectAllMode(null);
        refetch();
      },
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    const ids = [...selected];
    setConfirmAction({
      title: 'Delete Expenses',
      description: `Permanently delete ${ids.length} expense${ids.length > 1 ? 's' : ''}? This cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        setBulkDeleting(true);
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
      },
    });
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

  const handleAcceptDraft = async (id, updates) => {
    await base44.entities.Expense.update(id, updates);
    toast({ title: 'Expense approved', variant: 'success' });
    refetch();
  };

  const handleUndoRefund = async (expense) => {
    if (!window.confirm('Remove refund status from this expense?')) return;
    await base44.entities.Expense.update(expense.id, { is_refunded: false, refund_amount: 0 });
    toast({ title: 'Refund removed', variant: 'success' });
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
    <>
    <div className="space-y-4">
      {/* Unified toolbar */}
      <ExpenseToolbar
        onRefresh={refetch}
        onAddExpense={onAddExpense}
        uncategorizedCount={uncategorizedCount}
        showDistributions={showDistributions}
        onToggleDistributions={() => { setShowDistributions(v => !v); setPage(0); }}
      />

      {/* Uncategorized alert banner */}
      {uncategorizedCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300">
              <strong>{uncategorizedCount}</strong> expense{uncategorizedCount !== 1 ? 's' : ''} need categorization
            </span>
          </div>
        </div>
      )}

      {/* AI pending review banner */}
      {aiPendingCount > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm text-purple-300">
              <strong>{aiPendingCount}</strong> expense{aiPendingCount !== 1 ? 's' : ''} AI-categorized — review needed
            </span>
          </div>
          <button
            onClick={handleApproveAllAI}
            className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1.5 shrink-0"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve All
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3" data-tour="expense-summary-cards">
        <SummaryCard label="Total Expenses" value={kpis.total} color="text-red-400" />
        <SummaryCard label="COGS" value={kpis.cogsTotal} color="text-orange-400" />
        <SummaryCard label="Overhead" value={kpis.overheadTotal} color="text-slate-300" />
      </div>

      {/* Duplicate finder */}
      <div data-tour="expense-duplicate-cleaner">
        <DuplicateExpenseFinder onCleanupDone={refetch} />
      </div>

      {/* Category breakdown */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4" data-tour="expense-category-breakdown">
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
        <div className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-white">{selected.size} selected</span>

            <button
              onClick={handleBulkApprove}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>

            <BulkDropdown
              label="Set Category"
              options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              onSelect={(val) => handleBulkUpdate('category', val)}
              colorMap={CATEGORY_COLORS}
            />

            <BulkDropdown
              label="Set Type"
              options={[
                { value: 'cogs', label: 'COGS' },
                { value: 'overhead', label: 'Overhead' },
                { value: 'distribution', label: 'Distribution' },
              ]}
              onSelect={(val) => handleBulkUpdate('expense_type', val)}
              colorMap={TYPE_COLORS}
            />

            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-3 py-1.5 text-xs font-medium bg-red-600/80 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 ml-auto"
            >
              {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>

            <button onClick={() => { setSelected(new Set()); setSelectAllMode(null); }} className="text-xs text-slate-400 hover:text-white">
              Clear
            </button>
          </div>

          {selectAllMode === 'page' && totalFiltered > expenses.length && (
            <div className="text-xs text-slate-400">
              All {expenses.length} on this page selected.
              <button onClick={handleSelectAllFiltered} className="ml-1 text-[#D6FF03] hover:underline">
                Select all {totalFiltered} matching expenses
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
      <div className="space-y-2" data-tour="expense-filters">
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
            <option value="uncategorized">⚠ Uncategorized</option>
            <option value="cogs">COGS</option>
            <option value="overhead">Overhead</option>
            <option value="distribution">Distribution</option>
          </select>
          {bankAccounts.length > 0 && (
            <select value={filterAccount} onChange={e => handleFilterChange(setFilterAccount, e.target.value)} className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50">
              <option value="all">All Accounts</option>
              <option value="none">No Account</option>
              {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <div className="flex-1" />
          <span className="text-xs text-slate-500">
            {totalFiltered} expense{totalFiltered !== 1 ? 's' : ''}
            {filterCat !== 'all' || filterType !== 'all' || debouncedSearch ? ` · $${filteredTotal.toLocaleString()}` : ''}
          </span>
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
                  {(e.is_refunded || e.refund_amount > 0) ? (
                    <button onClick={() => handleUndoRefund(e)} title="Undo refund" className="p-1 text-amber-400"><Undo2 className="w-3 h-3" /></button>
                  ) : (
                    <button onClick={() => setRefundExpense(e)} title="Mark as refunded" className="p-1 text-slate-400 hover:text-emerald-400"><RotateCcw className="w-3 h-3" /></button>
                  )}
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
      <div className={`hidden sm:block bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden relative ${pageSwitching ? 'opacity-60' : ''}`} data-tour="expense-table">
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
              <col style={{ width: '110px' }} />
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
                <th className="text-left px-3 py-2 font-medium">Account</th>
                <SortableHeader field="amount" label="Amount" current={sortField} dir={sortDir} onClick={handleSort} align="right" />
                <th className="text-center px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {expenses.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-slate-500">No expenses match your filters</td></tr>
              ) : expenses.map(e => (
                <ExpenseRow key={e.id} expense={e} clients={clients} bankAccounts={bankAccounts} bankAccountMap={bankAccountMap} onUpdate={handleInlineUpdate} onDelete={() => handleDelete(e.id)} onApproveAI={handleApproveAI} onAcceptDraft={handleAcceptDraft} selected={selected.has(e.id)} onToggleSelect={() => toggleSelect(e.id)} onRefund={(exp) => setRefundExpense(exp)} onUndoRefund={handleUndoRefund} />
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

    <RefundModal
      expense={refundExpense}
      open={!!refundExpense}
      onClose={() => setRefundExpense(null)}
      onRefunded={refetch}
    />
    <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
      <AlertDialogContent className="bg-slate-900 border border-slate-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">{confirmAction?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (confirmAction?.onConfirm) await confirmAction.onConfirm();
              setConfirmAction(null);
            }}
            className={
              confirmAction?.variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : confirmAction?.variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : ''
            }
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
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
    if (!editing) return;
    if (inputRef.current && !options) inputRef.current.focus();
    if (options) {
      const handler = (ev) => {
        if (inputRef.current && !inputRef.current.contains(ev.target)) {
          setEditing(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [editing, options]);

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
      <div className="relative" ref={inputRef}>
        <div className="absolute top-0 left-0 bg-slate-800 border border-[#D6FF03]/50 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto min-w-[140px]">
          {options.map(o => (
            <button
              key={o.value}
              onMouseDown={(ev) => {
                ev.preventDefault();
                setLocalVal(o.value);
                onUpdate(expenseId, field, o.value);
                setEditing(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                o.value === localVal
                  ? 'bg-[#D6FF03]/10 text-[#D6FF03] font-medium'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {field === 'category' && CATEGORY_COLORS[o.value] ? (
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${CATEGORY_COLORS[o.value]}`}>{o.label}</span>
              ) : field === 'expense_type' && TYPE_COLORS[o.value] ? (
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${TYPE_COLORS[o.value]}`}>{o.label}</span>
              ) : (
                o.label
              )}
              {o.value === localVal && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <input ref={inputRef} type={type} value={localVal} onChange={ev => setLocalVal(ev.target.value)} onBlur={save} onKeyDown={onKey} className={`w-full min-w-0 px-1 py-0.5 text-xs bg-slate-900 border border-[#D6FF03]/50 rounded text-white outline-none ${type === 'number' ? 'text-right' : ''}`} />
  );
}

function BulkDropdown({ label, options, onSelect, colorMap = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white flex items-center gap-1.5"
      >
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto min-w-[160px]">
          {options.map(o => (
            <button
              key={o.value}
              onMouseDown={(ev) => {
                ev.preventDefault();
                setOpen(false);
                onSelect(o.value);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-2"
            >
              {colorMap[o.value] ? (
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorMap[o.value]}`}>{o.label}</span>
              ) : (
                o.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftDropdown({ value, onChange, options, colorMap = {}, labelMap = {}, isAISuggested = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayLabel = labelMap[value] || options.find(o => o.value === value)?.label || value;
  const colorClass = colorMap[value] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border cursor-pointer hover:ring-1 hover:ring-[#D6FF03]/40 transition-all ${colorClass}`}>
          {displayLabel}
        </span>
        {isAISuggested && (
          <span className="px-1 py-0.5 text-[7px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded leading-none">AI</span>
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-[#D6FF03]/50 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto min-w-[140px]">
          {options.map(o => (
            <button
              key={o.value}
              onMouseDown={(ev) => {
                ev.preventDefault();
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                o.value === value
                  ? 'bg-[#D6FF03]/10 text-[#D6FF03] font-medium'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {colorMap[o.value] ? (
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorMap[o.value]}`}>{o.label}</span>
              ) : (
                o.label
              )}
              {o.value === value && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftTextCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className="cursor-pointer rounded px-1 -mx-1 hover:bg-slate-600/30 transition-colors">
        <span className="truncate block">{value || '—'}</span>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === 'Escape') setEditing(false); }}
      className="w-full min-w-0 px-1 py-0.5 text-xs bg-slate-900 border border-[#D6FF03]/50 rounded text-white outline-none"
    />
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

function ExpenseRow({ expense: e, clients, bankAccounts, bankAccountMap, onUpdate, onDelete, onApproveAI, onAcceptDraft, selected, onToggleSelect, onRefund, onUndoRefund }) {
  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));
  const typeOptions = [{ value: 'uncategorized', label: 'Uncategorized' }, { value: 'cogs', label: 'COGS' }, { value: 'overhead', label: 'Overhead' }, { value: 'distribution', label: 'Distribution' }];
  const clientOptions = [{ value: '', label: 'None' }, ...clients.map(c => ({ value: c.id, label: c.name }))];
  const bankAccountOptions = [{ value: '', label: '— None —' }, ...(bankAccounts || []).map(a => ({ value: a.id, label: a.name }))];

  const hasPendingAI = !e.ai_approved && e.suggested_category;
  const isRefunded = e.is_refunded || (e.refund_amount && e.refund_amount > 0);

  const [draftCategory, setDraftCategory] = useState(
    hasPendingAI ? (e.suggested_category || e.category || 'uncategorized') : (e.category || 'uncategorized')
  );
  const [draftType, setDraftType] = useState(
    hasPendingAI ? (e.suggested_type || e.expense_type || 'uncategorized') : (e.expense_type || 'uncategorized')
  );
  const [draftVendor, setDraftVendor] = useState(e.vendor || '');
  const [draftClient, setDraftClient] = useState(e.client_id || '');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (hasPendingAI) {
      setDraftCategory(e.suggested_category || e.category || 'uncategorized');
      setDraftType(e.suggested_type || e.expense_type || 'uncategorized');
    } else {
      setDraftCategory(e.category || 'uncategorized');
      setDraftType(e.expense_type || 'uncategorized');
    }
    setDraftVendor(e.vendor || '');
    setDraftClient(e.client_id || '');
    setAccepted(false);
  }, [e.id, e.category, e.expense_type, e.vendor, e.client_id, e.suggested_category, e.suggested_type]);

  const handleAccept = () => {
    const update = {
      category: draftCategory,
      expense_type: draftType,
      vendor: draftVendor,
      suggested_category: '',
      suggested_type: '',
      ai_approved: true,
    };
    if (draftClient !== (e.client_id || '')) {
      update.client_id = draftClient || undefined;
    }
    setAccepted(true);
    onAcceptDraft(e.id, update);
  };

  return (
    <tr className={`hover:bg-slate-700/20 transition-colors group ${
      accepted ? 'opacity-50' :
      isRefunded ? 'opacity-50' :
      hasPendingAI ? 'bg-yellow-500/8 border-l-2 border-l-yellow-500/50' : ''
    } ${selected ? 'bg-red-500/5' : ''}`}>
      <td className="px-2 py-2 text-center">
        <button onClick={onToggleSelect}>
          {selected ? <CheckSquare className="w-3.5 h-3.5 text-red-400" /> : <Square className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />}
        </button>
      </td>
      <td className="px-3 py-2 text-slate-300">
        <InlineEditCell value={e.date || ''} displayValue={dayjs(e.date).format('MMM D, YYYY')} field="date" expenseId={e.id} onUpdate={onUpdate} type="date" />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {hasPendingAI && !accepted ? (
            <DraftDropdown
              value={draftCategory}
              onChange={setDraftCategory}
              options={categoryOptions}
              colorMap={CATEGORY_COLORS}
              labelMap={CATEGORY_LABELS}
              isAISuggested={draftCategory === e.suggested_category}
            />
          ) : (
            <InlineEditCell value={e.category || 'uncategorized'} displayValue={<span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>{CATEGORY_LABELS[e.category] || e.category}</span>} field="category" expenseId={e.id} onUpdate={onUpdate} options={categoryOptions} />
          )}
          {isRefunded && <span className="px-1 py-0.5 text-[7px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded leading-none shrink-0">REFUND</span>}
        </div>
      </td>
      <td className="px-3 py-2">
        {hasPendingAI && !accepted ? (
          <DraftDropdown
            value={draftType}
            onChange={setDraftType}
            options={typeOptions}
            colorMap={TYPE_COLORS}
            labelMap={TYPE_LABELS}
            isAISuggested={draftType === e.suggested_type}
          />
        ) : (
          <InlineEditCell value={e.expense_type || 'uncategorized'} displayValue={<span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${TYPE_COLORS[e.expense_type] || TYPE_COLORS.overhead}`}>{TYPE_LABELS[e.expense_type] || e.expense_type}</span>} field="expense_type" expenseId={e.id} onUpdate={onUpdate} options={typeOptions} />
        )}
      </td>
      <td className="px-3 py-2 text-white">
        <InlineEditCell value={e.description || ''} displayValue={<span className="truncate block">{e.description || '—'}</span>} field="description" expenseId={e.id} onUpdate={onUpdate} />
      </td>
      <td className="px-3 py-2 text-slate-400">
        {hasPendingAI && !accepted ? (
          <DraftTextCell value={draftVendor} onChange={setDraftVendor} />
        ) : (
          <InlineEditCell value={e.vendor || ''} displayValue={<span className="truncate block">{e.vendor || '—'}</span>} field="vendor" expenseId={e.id} onUpdate={onUpdate} />
        )}
      </td>
      <td className="px-3 py-2 text-slate-400">
        {hasPendingAI && !accepted ? (
          <DraftDropdown
            value={draftClient}
            onChange={setDraftClient}
            options={clientOptions}
            colorMap={{}}
            labelMap={{}}
          />
        ) : (
          <InlineEditCell value={e.client_id || ''} displayValue={<span className="truncate block">{e.client_name || '—'}</span>} field="client_id" expenseId={e.id} onUpdate={onUpdate} options={clientOptions} />
        )}
      </td>
      <td className="px-3 py-2 text-slate-400">
        <InlineEditCell value={e.bank_account_id || ''} displayValue={<span className="truncate block">{bankAccountMap[e.bank_account_id] || '—'}</span>} field="bank_account_id" expenseId={e.id} onUpdate={onUpdate} options={bankAccountOptions} />
      </td>
      <td className="px-3 py-2 text-right font-bold text-red-400">
        {isRefunded ? (
          <div>
            <span className="text-red-400 line-through text-[10px]">${(e.amount || 0).toLocaleString()}</span>
            {e.is_refunded ? (
              <span className="block text-emerald-400 text-[10px]">Fully refunded</span>
            ) : (
              <span className="block text-emerald-400 text-xs">${((e.amount || 0) - (e.refund_amount || 0)).toLocaleString()}</span>
            )}
          </div>
        ) : (
          <InlineEditCell value={e.amount || 0} displayValue={`$${(e.amount || 0).toLocaleString()}`} field="amount" expenseId={e.id} onUpdate={onUpdate} type="number" className="text-right" />
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {hasPendingAI && !accepted && (
            <button onClick={handleAccept} title="Accept & save" className="p-1 text-emerald-400 hover:text-emerald-300 transition-all">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {accepted && <Check className="w-4 h-4 text-emerald-500" />}
          {isRefunded ? (
            <button onClick={() => onUndoRefund(e)} title="Undo refund" className="p-1 text-amber-400 opacity-0 group-hover:opacity-100 hover:text-amber-300 transition-all">
              <Undo2 className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={() => onRefund(e)} title="Mark as refunded" className="p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-emerald-400 transition-all">
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          <button onClick={onDelete} className="p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
        </div>
      </td>
    </tr>
  );
}