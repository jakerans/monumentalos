import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Receipt, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function ClientInvoiceHistory({ clientId }) {
  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: () => base44.entities.MonthlyBilling.filter({ client_id: clientId }, '-billing_month', 50),
    enabled: !!clientId,
  });

  if (invoices.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-white">Invoice History</h3>
        </div>
        <p className="text-xs text-slate-500 text-center py-4">No invoices yet</p>
      </div>
    );
  }

  const outstanding = invoices.filter(i => i.status !== 'paid');
  const totalOutstanding = outstanding.reduce((s, i) => s + (i.calculated_amount || i.manual_amount || 0), 0);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-white">Invoice History</h3>
        </div>
        {totalOutstanding > 0 && (
          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
            ${totalOutstanding.toLocaleString()} outstanding
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-700/30">
        {invoices.map(inv => {
          const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const amount = inv.calculated_amount || inv.manual_amount || 0;
          return (
            <div key={inv.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-700/20">
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{inv.billing_month}</p>
                  <p className="text-[10px] text-slate-500">
                    {inv.billing_type === 'retainer' ? 'Retainer' : inv.billing_type === 'pay_per_set' ? `${inv.quantity || 0} sets` : `${inv.quantity || 0} shows`}
                    {inv.paid_date && <span> · Paid {new Date(inv.paid_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${inv.status === 'paid' ? 'text-green-400' : 'text-white'}`}>
                  ${amount.toLocaleString()}
                </p>
                <span className={`text-[9px] font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}