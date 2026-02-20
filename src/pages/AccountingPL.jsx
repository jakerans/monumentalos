import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import AccountingKPIs from '../components/admin/AccountingKPIs';
import MonthlyPLChart from '../components/admin/MonthlyPLChart';
import ExpenseBreakdown from '../components/admin/ExpenseBreakdown';
import PaymentLedger from '../components/admin/PaymentLedger';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import RevenueDashboardSkeleton from '../components/admin/RevenueDashboardSkeleton';

export default function AccountingPL() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin') {
          if (currentUser.app_role === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else navigate(createPageUrl('SetterDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const revFetchStart = dayjs(startDate).subtract(6, 'month').format('YYYY-MM-DD');

  const { data: dashData, isLoading, refetch: refetchAll } = useQuery({
    queryKey: ['revenue-dashboard-data', revFetchStart, startDate, endDate],
    queryFn: async () => {
      const res = await base44.functions.invoke('getRevenueDashboardData', { revFetchStart, startDate, endDate });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const clients = dashData?.clients || [];
  const billingRecords = dashData?.billingRecords || [];
  const expenses = dashData?.expenses || [];
  const monthlyPL = dashData?.monthlyPL || [];
  const kpis = dashData?.kpis || null;

  const payments = React.useMemo(() => {
    return billingRecords.filter(b => b.status === 'paid').map(b => ({
      id: b.id,
      client_id: b.client_id,
      amount: b.paid_amount || b.calculated_amount || 0,
      date: b.paid_date,
      method: b.payment_method || 'invoice',
      notes: `Invoice ${b.invoice_id || ''} (${b.billing_month})`,
      invoice_id: b.invoice_id,
      billing_month: b.billing_month,
    }));
  }, [billingRecords]);

  if (!user) return null;
  if (isLoading) return <RevenueDashboardSkeleton />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="AccountingPL" clients={clients} />
        <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">P&L</h1>
              <p className="text-sm text-slate-400">Profit & loss overview, payments & expense breakdown</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
            </div>
          </div>

          <AccountingKPIs kpis={kpis} payments={payments} expenses={expenses} />
          <MonthlyPLChart data={monthlyPL} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentLedger payments={payments} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchAll} />
            <ExpenseBreakdown expenses={expenses} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchAll} />
          </div>
        </main>

        <AdminMobileNav currentPage="AccountingPL" clients={clients} />
      </div>
    </PageErrorBoundary>
  );
}