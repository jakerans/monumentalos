import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle } from 'lucide-react';

export default function OutstandingInvoiceAlert({ clientId }) {
  const { data: invoices = [] } = useQuery({
    queryKey: ['client-outstanding-invoices', clientId],
    queryFn: () => base44.entities.MonthlyBilling.filter({ client_id: clientId }, '-billing_month', 100),
    enabled: !!clientId,
  });

  const outstanding = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  if (outstanding.length === 0) return null;

  const totalAmount = outstanding.reduce((s, i) => s + (i.calculated_amount || i.manual_amount || 0), 0);
  const hasOverdue = outstanding.some(i => i.status === 'overdue');
  const months = outstanding.map(i => i.billing_month).join(', ');

  return (
    <div className={`rounded-lg border p-4 mb-6 ${hasOverdue ? 'bg-red-500/10 border-red-500/40' : 'bg-amber-500/10 border-amber-500/40'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full flex-shrink-0 ${hasOverdue ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
          <AlertTriangle className={`w-5 h-5 ${hasOverdue ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-bold ${hasOverdue ? 'text-red-400' : 'text-amber-400'}`}>
            {hasOverdue ? 'Overdue Invoice' : 'Outstanding Invoice'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            You have <span className="font-bold text-white">${totalAmount.toLocaleString()}</span> in outstanding invoices for <span className="font-medium text-white">{months}</span>.
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Please contact us if you have any questions about your billing.
          </p>
        </div>
      </div>
    </div>
  );
}