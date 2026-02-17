import React from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

dayjs.extend(isBetween);

const METHOD_LABELS = { ach: 'ACH', check: 'Check', wire: 'Wire', credit_card: 'Card', cash: 'Cash', other: 'Other' };

export default function PaymentLedger({ payments, clients, startDate, endDate, onRefresh }) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const filtered = payments.filter(p => p.date && dayjs(p.date).isBetween(start, end, null, '[]'));
  const total = filtered.reduce((s, p) => s + (p.amount || 0), 0);

  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const handleDelete = async (id) => {
    await base44.entities.Payment.delete(id);
    onRefresh();
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Payment Ledger</h2>
        <span className="text-sm font-bold text-emerald-600">Total: ${total.toLocaleString()}</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-700/30">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-500 text-center">No payments in this period</div>
        ) : filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => (
          <div key={p.id} className="px-4 py-2 flex items-center justify-between hover:bg-slate-700/20">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white">{getClientName(p.client_id)}</p>
              <p className="text-[10px] text-slate-500">
                {p.date} · {METHOD_LABELS[p.method] || p.method}
                {p.period_start && p.period_end ? ` · Period: ${p.period_start} → ${p.period_end}` : ''}
                {p.notes ? ` · ${p.notes}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-emerald-600">+${p.amount?.toLocaleString()}</span>
              <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}