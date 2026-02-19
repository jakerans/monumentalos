import React, { useState, forwardRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Clock, AlertTriangle, DollarSign, Pencil, Trash2, Loader2 } from 'lucide-react';
import FlipMove from 'react-flip-move';
import MarkPaidModal from './MarkPaidModal';
import EditInvoiceModal from './EditInvoiceModal';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer', setup_fee: 'Setup Fee' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-100 text-blue-700', pay_per_set: 'bg-purple-100 text-purple-700', retainer: 'bg-amber-100 text-amber-700', setup_fee: 'bg-emerald-100 text-emerald-700' };

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  paid: { label: 'Paid', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export default function BillingTable({ rows, kpis, pagination, onRefresh, onPageChange }) {
  const [markPaidRecord, setMarkPaidRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

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

    // Auto-create processing fee expense as COGS
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

  const { totalAmount = 0, totalPaid = 0, totalPending = 0 } = kpis || {};
  const { page = 0, totalPages = 1, totalCount = 0 } = pagination || {};

  return (
    <>
      {/* Summary cards — pre-computed from backend */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase">Total To Bill</p>
          <p className="text-2xl font-bold text-white">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase">Collected</p>
          <p className="text-2xl font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase">Outstanding</p>
          <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-amber-400' : 'text-slate-500'}`}>${totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Bulk delete toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-xs text-red-300 font-medium">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-slate-700/30">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No billing records for this month</div>
          ) : rows.map(r => {
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type]}`}>{BILLING_LABELS[r.billing_type]}</span>
                  {r.billing_type !== 'retainer' && <span className="text-[11px] text-slate-400">Qty: {r.quantity || 0}</span>}
                  {r.rate && <span className="text-[11px] text-slate-400">@ ${r.rate}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">${r.amount.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {r.status === 'paid' && <span className="text-xs font-medium text-emerald-600">${(r.paid_amount || r.amount).toLocaleString()}</span>}
                    {r.status !== 'paid' && (
                      <button onClick={() => setMarkPaidRecord(r)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        <DollarSign className="w-3 h-3" /> Pay
                      </button>
                    )}
                    <button onClick={() => setEditRecord(r)} className="p-1 text-gray-400 hover:text-blue-400 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">
                  <input type="checkbox" checked={rows.length > 0 && selectedIds.size === rows.length} onChange={toggleAll} className="rounded border-slate-600 bg-slate-700 text-blue-500 w-3.5 h-3.5 cursor-pointer" />
                </th>
                <th className="px-4 py-2.5 text-left">Client</th>
                <th className="px-3 py-2.5 text-left">Type</th>
                <th className="px-3 py-2.5 text-center">Due Day</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Rate</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Paid</th>
                <th className="px-3 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <FlipMove typeName="tbody" duration={350} easing="cubic-bezier(0.25, 0.46, 0.45, 0.94)" staggerDurationBy={15} enterAnimation="fade" leaveAnimation="fade" className="divide-y divide-slate-700/30">
              {rows.length === 0 ? (
                <tr key="empty"><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No billing records for this month</td></tr>
              ) : rows.map(r => (
                <BillingRow key={r.id} r={r} STATUS_CONFIG={STATUS_CONFIG} BILLING_LABELS={BILLING_LABELS} BILLING_COLORS={BILLING_COLORS} setMarkPaidRecord={setMarkPaidRecord} setEditRecord={setEditRecord} />
              ))}
            </FlipMove>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-400">{totalCount} record{totalCount !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {markPaidRecord && (
        <MarkPaidModal
          record={markPaidRecord}
          clientName={markPaidRecord.clientName}
          open={!!markPaidRecord}
          onOpenChange={(v) => { if (!v) setMarkPaidRecord(null); }}
          onConfirm={handleMarkPaid}
        />
      )}

      {editRecord && (
        <EditInvoiceModal
          record={editRecord}
          clientName={editRecord.clientName}
          open={!!editRecord}
          onOpenChange={(v) => { if (!v) setEditRecord(null); }}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}

const BillingRow = forwardRef(({ r, STATUS_CONFIG, BILLING_LABELS, BILLING_COLORS, setMarkPaidRecord, setEditRecord }, ref) => {
  const sc = STATUS_CONFIG[r.displayStatus] || STATUS_CONFIG.pending;
  const dueDay = r.retainerDueDay;
  const dueDaySuffix = dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th';

  return (
    <tr ref={ref} className="hover:bg-slate-700/20">
      <td className="px-4 py-3"><span className="font-medium text-white">{r.clientName}</span></td>
      <td className="px-3 py-3">
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type]}`}>{BILLING_LABELS[r.billing_type]}</span>
      </td>
      <td className="px-3 py-3 text-center text-slate-300 text-xs">
        {r.billing_type === 'retainer' && dueDay
          ? `${dueDay}${dueDaySuffix}`
          : r.billing_type === 'retainer' ? '1st' : '—'}
      </td>
      <td className="px-3 py-3 text-right text-slate-300">{r.billing_type === 'retainer' ? '—' : (r.quantity || 0)}</td>
      <td className="px-3 py-3 text-right text-slate-300">{r.rate ? `$${r.rate}` : '—'}</td>
      <td className="px-3 py-3 text-right font-medium text-white">${r.amount.toLocaleString()}</td>
      <td className="px-3 py-3 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${sc.bg} ${sc.color}`}>
          <sc.icon className="w-3 h-3" />{sc.label}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        {r.status === 'paid' ? <span className="font-medium text-emerald-600">${(r.paid_amount || r.amount).toLocaleString()}</span> : <span className="text-gray-400">—</span>}
      </td>
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {r.status !== 'paid' && (
            <button onClick={() => setMarkPaidRecord(r)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700">
              <DollarSign className="w-3 h-3" /> Pay
            </button>
          )}
          {r.status === 'paid' && <span className="text-[10px] text-gray-400 mr-1">{r.paid_date || ''}</span>}
          <button onClick={() => setEditRecord(r)} className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Edit invoice">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});