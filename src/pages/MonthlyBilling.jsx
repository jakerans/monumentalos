import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { RefreshCw } from 'lucide-react';
import AdminNav from '../components/admin/AdminNav';
import BillingMonthSelector from '../components/admin/BillingMonthSelector';
import BillingTable from '../components/admin/BillingTable';

function getPrevMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthlyBilling() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getPrevMonth());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin' && currentUser.app_role !== 'onboard_admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [] } = useQuery({
    queryKey: ['billing-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: billingRecords = [], refetch: refetchBilling } = useQuery({
    queryKey: ['billing-records', selectedMonth],
    queryFn: () => base44.entities.MonthlyBilling.filter({ billing_month: selectedMonth }),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['billing-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 5000),
  });

  // Check if this month is past the 5th (for overdue logic)
  const now = new Date();
  const [selYear, selMonth] = selectedMonth.split('-').map(Number);
  // Billing for month X is due by the 5th of month X+1
  const dueDate = new Date(selYear, selMonth, 5); // month is 0-indexed so selMonth = next month
  const isOverdueMonth = now > dueDate;

  const activeClients = clients.filter(c => c.status === 'active');
  const existingClientIds = new Set(billingRecords.map(r => r.client_id));
  const missingClients = activeClients.filter(c => !existingClientIds.has(c.id));

  const generateBillingRecords = async () => {
    setGenerating(true);

    const monthStart = new Date(selYear, selMonth - 1, 1);
    const monthEnd = new Date(selYear, selMonth, 0, 23, 59, 59);

    const records = missingClients.map(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = leads.filter(l => l.client_id === client.id);

      let quantity = 0;
      let rate = 0;
      let calculatedAmount = 0;

      if (bt === 'pay_per_show') {
        const showed = cLeads.filter(l =>
          l.disposition === 'showed' && l.appointment_date &&
          new Date(l.appointment_date) >= monthStart && new Date(l.appointment_date) <= monthEnd
        );
        quantity = showed.length;
        rate = client.price_per_shown_appointment || 0;
        calculatedAmount = quantity * rate;
      } else if (bt === 'pay_per_set') {
        const booked = cLeads.filter(l =>
          l.date_appointment_set &&
          new Date(l.date_appointment_set) >= monthStart && new Date(l.date_appointment_set) <= monthEnd
        );
        quantity = booked.length;
        rate = client.price_per_set_appointment || 0;
        calculatedAmount = quantity * rate;
      } else if (bt === 'retainer') {
        rate = client.retainer_amount || 0;
        calculatedAmount = rate;
      }

      return {
        client_id: client.id,
        billing_month: selectedMonth,
        billing_type: bt,
        calculated_amount: calculatedAmount,
        quantity,
        rate,
        status: 'pending',
      };
    });

    if (records.length > 0) {
      await base44.entities.MonthlyBilling.bulkCreate(records);
    }

    // Also auto-flag overdue records
    if (isOverdueMonth) {
      const pendingRecords = billingRecords.filter(r => r.status === 'pending');
      for (const r of pendingRecords) {
        await base44.entities.MonthlyBilling.update(r.id, { status: 'overdue' });
      }
    }

    setGenerating(false);
    refetchBilling();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="MonthlyBilling" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Monthly Billing</h1>
            <p className="text-xs text-slate-400">
              Retainer clients are billed on their due day. Set/show clients billed for the previous month.
            </p>
          </div>
          <BillingMonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        </div>

        {/* Overdue banner */}
        {isOverdueMonth && billingRecords.some(r => r.status === 'pending' || r.status === 'overdue') && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="text-red-400 text-xs font-medium">
              ⚠ This billing period is past due (due by {new Date(selYear, selMonth, 5).toLocaleDateString()}). Unpaid invoices are overdue.
            </span>
          </div>
        )}

        {/* Generate button if there are missing clients */}
        {missingClients.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-blue-400 text-xs font-medium">
              {missingClients.length} active client{missingClients.length > 1 ? 's' : ''} don't have billing records for this month yet.
            </span>
            <button
              onClick={generateBillingRecords}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Billing Records'}
            </button>
          </div>
        )}

        <BillingTable
          billingRecords={billingRecords}
          clients={clients}
          onRefresh={refetchBilling}
          isOverdueMonth={isOverdueMonth}
        />
      </main>
    </div>
  );
}