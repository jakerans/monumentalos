import React, { useState, useMemo, forwardRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Clock, AlertTriangle, DollarSign, Trash2, Loader2, ArrowUp, ArrowDown, ArrowUpDown, Save, X } from 'lucide-react';
import FlipMove from 'react-flip-move';
import { toast } from '@/components/ui/use-toast';
import MarkPaidModal from './MarkPaidModal';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer', setup_fee: 'Setup Fee' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-500/15 text-blue-400', pay_per_set: 'bg-purple-500/15 text-purple-400', retainer: 'bg-amber-500/15 text-amber-400', setup_fee: 'bg-emerald-500/15 text-emerald-400' };

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  paid: { label: 'Paid', icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

function SortHeader({ label, field, sortField, sortDir, onSort, align }) {
  const active = sortField === field;
  return (
    <th
      className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} cursor-pointer hover:text-slate-200 select-none`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
}

export default function BillingTable({ rows, kpis, pagination, onRefresh, onPageChange }) {
  const [markPaidRecord, setMarkPaidRecord] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'outstanding' || field === 'amount' ? 'desc' : 'asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    return [...rows].sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDir]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selectedIds.size === rows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map(r => r.id)));
  };
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} billing record${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    for (const id of selectedIds) {
      await base44.entities.MonthlyBilling.delete(id);
    }
    setSelectedIds(new Set());
    setDeleting(false);
    onRefresh();
  };

  const handleMarkPaid = async (record, paidAmount, paidDate, method, notes, processingFee = 0) => {
    await base44.entities.MonthlyBilling.update(record.id, {
      status: 'paid',
      paid_amount: paidAmount,
      paid_date: paidDate,
      payment_method: method || 'ach',
      processing_fee: processingFee || undefined,
      notes: notes || record.notes,
    });
    if (processingFee > 0) {
      await base44.entities.Expense.create({
        category: 'processing_fee',
        expense_type: 'cogs',
        description: `Processing fee — ${record.clientName}`,
        amount: processingFee,
        date: paidDate,
        client_id: record.client_id,
        vendor: method === 'credit_card' ? 'Credit Card Processor' : 'Payment Processor',
      });
    }
    onRefresh();
  };

  // Inline editing
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditData({
      billing_type: row.billing_type,
      quantity: row.quantity || 0,
      rate: row.rate || 0,
      manual_amount: row.manual_amount || row.calculated_amount || 0,
      notes: row.notes || '',
      status: row.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (row) => {
    setSaving(true);
    const isRetainer = editData.billing_type === 'retainer';
    const updates = {
      billing_type: editData.billing_type,
      quantity: isRetainer ? 0 : Number(editData.quantity),
      rate: Number(editData.rate),
      calculated_amount: isRetainer ? Number(editData.manual_amount) : Number(editData.quantity) * Number(editData.rate),
      manual_amount: isRetainer ? Number(editData.manual_amount) : undefined,
      notes: editData.notes,
      status: editData.status,
    };
    await base44.entities.MonthlyBilling.update(row.id, updates);
    toast({ title: 'Invoice updated', variant: 'success' });
    setEditingId(null);
    setEditData({});
    setSaving(false);
    onRefresh();
  };

  const { totalAmount = 0, totalPaid = 0, totalPending = 0 } = kpis || {};
  const { page = 0, totalPages = 1, totalCount = 0 } = pagination || {};

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase">Total To Bill</p>
          <p className="text-2xl font-bold text-white">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase">Collected</p>
          <p className="text-2xl font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
        </div>
        <div className={`bg-slate-800/50 rounded-lg border p-4 ${totalPending > 0 ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-slate-700/50'}`}>
          <p className="text-[10px] font-medium text-slate-400 uppercase">Outstanding</p>
          <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-red-400' : 'text-slate-500'}`}>${totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Bulk delete toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-xs text-red-300 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-slate-700/30">
          {sortedRows.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No billing records for this month</div>
          ) : sortedRows.map(r => {
            const sc = STATUS_CONFIG[r.displayStatus] || STATUS_CONFIG.pending;
            return (
              <div key={r.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded border-slate-600 bg-slate-700 text-blue-500 w-3.5 h-3.5 cursor-pointer" />
                    <span className="font-medium text-white text-sm">{r.clientName}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${sc.bg} ${sc.color}`}>
                    <sc.icon className="w-3 h-3" />{sc.label}
                  </span>
                </div>
                {r.pricingSummary && <p className="text-[10px] text-slate-500">{r.pricingSummary}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">${r.amount.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {r.outstanding > 0 && (
                      <span className="text-xs font-bold text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]">${r.outstanding.toLocaleString()}</span>
                    )}
                    {r.status !== 'paid' && (
                      <button onClick={() => setMarkPaidRecord(r)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        <DollarSign className="w-3 h-3" /> Pay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">
                  <input type="checkbox" checked={rows.length > 0 && selectedIds.size === rows.length} onChange={toggleAll} className="rounded border-slate-600 bg-slate-700 text-blue-500 w-3.5 h-3.5 cursor-pointer" />
                </th>
                <SortHeader label="Client" field="clientName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="px-3 py-2.5 text-left">Pricing</th>
                <SortHeader label="Type" field="billing_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Qty" field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Rate" field="rate" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Amount" field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Outstanding" field="outstanding" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Status" field="displayStatus" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
                <th className="px-3 py-2.5 text-right">Paid</th>
                <th className="px-3 py-2.5 text-left">Notes</th>
                <th className="px-3 py-2.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              <FlipMove typeName={null}>
                {sortedRows.length === 0 ? (
                  <tr key="empty"><td colSpan={12} className="px-4 py-8 text-center text-slate-500">No billing records for this month</td></tr>
                ) : sortedRows.map(r => (
                  <BillingRow
                    key={r.id}
                    r={r}
                    isEditing={editingId === r.id}
                    editData={editData}
                    setEditData={setEditData}
                    saving={saving}
                    onStartEdit={() => startEdit(r)}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={() => saveEdit(r)}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    onMarkPaid={() => setMarkPaidRecord(r)}
                  />
                ))}
              </FlipMove>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">{totalCount} record{totalCount !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="px-3 py-1 text-xs bg-slate-700 text-white rounded disabled:opacity-40 hover:bg-slate-600">Prev</button>
              <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
              <button disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1 text-xs bg-slate-700 text-white rounded disabled:opacity-40 hover:bg-slate-600">Next</button>
            </div>
          </div>
        )}
      </div>

      {markPaidRecord && (
        <MarkPaidModal
          record={markPaidRecord}
          clientName={markPaidRecord.clientName}
          open={!!markPaidRecord}
          onOpenChange={() => setMarkPaidRecord(null)}
          onConfirm={handleMarkPaid}
        />
      )}
    </>
  );
}

const BillingRow = forwardRef(({ r, isEditing, editData, setEditData, saving, onStartEdit, onCancelEdit, onSaveEdit, selectedIds, toggleSelect, onMarkPaid }, ref) => {
  const sc = STATUS_CONFIG[r.displayStatus] || STATUS_CONFIG.pending;
  const hasOutstanding = r.outstanding > 0;

  if (isEditing) {
    const isRetainer = editData.billing_type === 'retainer';
    const calcAmt = isRetainer ? Number(editData.manual_amount) : Number(editData.quantity) * Number(editData.rate);
    return (
      <tr ref={ref} className="bg-slate-700/20">
        <td className="px-3 py-2 text-center">
          <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded border-slate-600 bg-slate-700 text-blue-500 w-3.5 h-3.5 cursor-pointer" />
        </td>
        <td className="px-4 py-2 text-white text-xs font-medium">{r.clientName}</td>
        <td className="px-3 py-2 text-[10px] text-slate-500">{r.pricingSummary || '—'}</td>
        <td className="px-3 py-2">
          <select value={editData.billing_type} onChange={e => setEditData(d => ({ ...d, billing_type: e.target.value }))} className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-1.5 py-1 w-full">
            <option value="pay_per_show">Per Show</option>
            <option value="pay_per_set">Per Set</option>
            <option value="retainer">Retainer</option>
          </select>
        </td>
        <td className="px-3 py-2">
          {!isRetainer && <input type="number" value={editData.quantity} onChange={e => setEditData(d => ({ ...d, quantity: e.target.value }))} className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-1.5 py-1 w-16 text-right" />}
        </td>
        <td className="px-3 py-2">
          {!isRetainer ? (
            <input type="number" value={editData.rate} onChange={e => setEditData(d => ({ ...d, rate: e.target.value }))} className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-1.5 py-1 w-20 text-right" />
          ) : (
            <input type="number" value={editData.manual_amount} onChange={e => setEditData(d => ({ ...d, manual_amount: e.target.value }))} className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-1.5 py-1 w-20 text-right" />
          )}
        </td>
        <td className="px-3 py-2 text-right text-xs font-bold text-white">${calcAmt.toLocaleString()}</td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2">
          <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-1.5 py-1">
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2">
          <input type="text" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} placeholder="Notes" className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-1.5 py-1 w-full" />
        </td>
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <button onClick={onSaveEdit} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onCancelEdit} className="p-1 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr ref={ref} className="hover:bg-slate-700/20 group cursor-pointer" onDoubleClick={onStartEdit}>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded border-slate-600 bg-slate-700 text-blue-500 w-3.5 h-3.5 cursor-pointer" />
      </td>
      <td className="px-4 py-2">
        <span className="text-xs font-medium text-white">{r.clientName}</span>
      </td>
      <td className="px-3 py-2">
        <span className="text-[10px] text-slate-500">{r.pricingSummary || '—'}</span>
      </td>
      <td className="px-3 py-2">
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type]}`}>{BILLING_LABELS[r.billing_type]}</span>
      </td>
      <td className="px-3 py-2 text-right text-xs text-slate-300">{r.billing_type !== 'retainer' ? r.quantity || 0 : '—'}</td>
      <td className="px-3 py-2 text-right text-xs text-slate-300">{r.rate ? `$${r.rate}` : '—'}</td>
      <td className="px-3 py-2 text-right text-xs font-bold text-white">${r.amount.toLocaleString()}</td>
      <td className="px-3 py-2 text-right">
        {hasOutstanding ? (
          <span className="text-xs font-bold text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            ${r.outstanding.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-slate-600">$0</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${sc.bg} ${sc.color}`}>
          <sc.icon className="w-3 h-3" />{sc.label}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-xs text-slate-300">
        {r.status === 'paid' ? `$${(r.paid_amount || r.amount).toLocaleString()}` : '—'}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500 max-w-[120px] truncate">{r.notes || '—'}</td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {r.status !== 'paid' && (
            <button onClick={onMarkPaid} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700">
              <DollarSign className="w-3 h-3" /> Pay
            </button>
          )}
          <button onClick={onStartEdit} className="p-1 text-slate-500 hover:text-blue-400" title="Edit">
            <Save className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
});