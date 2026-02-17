import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Clock, AlertTriangle, DollarSign, Pencil, Trash2 } from 'lucide-react';
import MarkPaidModal from './MarkPaidModal';
import EditInvoiceModal from './EditInvoiceModal';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-100 text-blue-700', pay_per_set: 'bg-purple-100 text-purple-700', retainer: 'bg-amber-100 text-amber-700' };

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  paid: { label: 'Paid', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export default function BillingTable({ billingRecords, clients, onRefresh, isOverdueMonth }) {
  const [markPaidRecord, setMarkPaidRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  const getClient = (id) => clients.find(c => c.id === id);

  const handleMarkPaid = async (record, paidAmount, paidDate, notes) => {
    await base44.entities.MonthlyBilling.update(record.id, {
      status: 'paid',
      paid_amount: paidAmount,
      paid_date: paidDate,
      notes: notes || record.notes,
    });
    onRefresh();
  };

  const rows = billingRecords.map(record => {
    const client = getClient(record.client_id);
    const amount = record.billing_type === 'retainer'
      ? (record.manual_amount || record.calculated_amount || 0)
      : (record.calculated_amount || 0);

    // If it's overdue month and still pending, mark as overdue display
    const displayStatus = (isOverdueMonth && record.status === 'pending') ? 'overdue' : record.status;

    return { ...record, client, amount, displayStatus };
  });

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const totalPaid = rows.filter(r => r.status === 'paid').reduce((s, r) => s + (r.paid_amount || r.amount), 0);
  const totalPending = totalAmount - totalPaid;

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Total To Bill</p>
          <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Collected</p>
          <p className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Outstanding</p>
          <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-amber-600' : 'text-gray-400'}`}>${totalPending.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
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
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No billing records for this month</td></tr>
              ) : rows.map(r => {
                const sc = STATUS_CONFIG[r.displayStatus] || STATUS_CONFIG.pending;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{r.client?.name || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type]}`}>
                        {BILLING_LABELS[r.billing_type]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700 text-xs">
                      {r.billing_type === 'retainer' && r.client?.retainer_due_day
                        ? `${r.client.retainer_due_day}${r.client.retainer_due_day === 1 ? 'st' : r.client.retainer_due_day === 2 ? 'nd' : r.client.retainer_due_day === 3 ? 'rd' : 'th'}`
                        : r.billing_type === 'retainer' ? '1st' : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">
                      {r.billing_type === 'retainer' ? '—' : (r.quantity || 0)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">
                      {r.rate ? `$${r.rate}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900">
                      ${r.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${sc.bg} ${sc.color}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {r.status === 'paid' ? (
                        <span className="font-medium text-emerald-600">${(r.paid_amount || r.amount).toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.status !== 'paid' && (
                          <button
                            onClick={() => setMarkPaidRecord(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <DollarSign className="w-3 h-3" /> Pay
                          </button>
                        )}
                        {r.status === 'paid' && (
                          <span className="text-[10px] text-gray-400 mr-1">{r.paid_date || ''}</span>
                        )}
                        <button
                          onClick={() => setEditRecord(r)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                          title="Edit invoice"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {markPaidRecord && (
        <MarkPaidModal
          record={markPaidRecord}
          clientName={markPaidRecord.client?.name}
          open={!!markPaidRecord}
          onOpenChange={(v) => { if (!v) setMarkPaidRecord(null); }}
          onConfirm={handleMarkPaid}
        />
      )}

      {editRecord && (
        <EditInvoiceModal
          record={editRecord}
          clientName={editRecord.client?.name}
          open={!!editRecord}
          onOpenChange={(v) => { if (!v) setEditRecord(null); }}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}