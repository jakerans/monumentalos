import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import PLSummaryCards from '../components/admin/PLSummaryCards';
import PLStatement from '../components/admin/PLStatement';
import MonthlyPLChart from '../components/admin/MonthlyPLChart';
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
        const allowed = ['admin', 'finance_admin'];
        if (!allowed.includes(currentUser.app_role)) {
          if (currentUser.app_role === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else navigate(createPageUrl('SetterDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const revFetchStart = dayjs(startDate).subtract(6, 'month').format('YYYY-MM-DD');

  const { data: dashData, isLoading } = useQuery({
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

  if (!user) return null;
  if (isLoading) return <RevenueDashboardSkeleton />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="AccountingPL" clients={clients} />
        <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Profit & Loss</h1>
              <p className="text-sm text-slate-400">Income, expenses & profitability breakdown</p>
            </div>
            <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          </div>

          <PLSummaryCards kpis={kpis} />

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-2">
              <PLStatement
                kpis={kpis}
                expenses={expenses}
                billingRecords={billingRecords}
                clients={clients}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
            <div className="xl:col-span-3">
              <MonthlyPLChart data={monthlyPL} />
            </div>
          </div>
        </main>
        <AdminMobileNav currentPage="AccountingPL" clients={clients} />
      </div>
    </PageErrorBoundary>
  );
}