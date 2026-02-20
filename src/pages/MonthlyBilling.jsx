import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import { RefreshCw } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import BillingMonthSelector from '../components/admin/BillingMonthSelector';
import BillingTable from '../components/admin/BillingTable';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

function getPrevMonth() {
  return dayjs().subtract(1, 'month').format('YYYY-MM');
}

export default function MonthlyBilling() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getPrevMonth());
  const [page, setPage] = useState(0);
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

  // Reset page when month changes
  useEffect(() => { setPage(0); }, [selectedMonth]);

  const { data: dashData, refetch, isLoading } = useQuery({
    queryKey: ['monthly-billing-data', selectedMonth, page],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyBillingData', { selectedMonth, page, pageSize: 50 });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const rows = dashData?.rows || [];
  const kpis = dashData?.kpis || {};
  const pagination = dashData?.pagination || {};
  const isOverdueMonth = dashData?.isOverdueMonth || false;
  const missingClientCount = dashData?.missingClientCount || 0;
  const clients = dashData?.clients || [];

  const [selYear, selMonth] = selectedMonth.split('-').map(Number);

  const generateBillingRecords = async () => {
    setGenerating(true);
    await base44.functions.invoke('getMonthlyBillingData', { selectedMonth, action: 'generate' });
    setGenerating(false);
    refetch();
  };

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading billing..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="MonthlyBilling" clients={clients} />

      <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
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
        {isOverdueMonth && rows.some(r => r.status === 'pending' || r.status === 'overdue') && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="text-red-400 text-xs font-medium">
              ⚠ This billing period is past due (due by {new Date(selYear, selMonth, 5).toLocaleDateString()}). Unpaid invoices are overdue.
            </span>
          </div>
        )}

        {/* Generate button if there are missing clients */}
        {missingClientCount > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-blue-400 text-xs font-medium">
              {missingClientCount} active client{missingClientCount > 1 ? 's' : ''} don't have billing records for this month yet.
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
          rows={rows}
          kpis={kpis}
          pagination={pagination}
          onRefresh={refetch}
          onPageChange={setPage}
        />
      </main>
      <AdminMobileNav currentPage="MonthlyBilling" clients={clients} />
    </div>
    </PageErrorBoundary>
  );
}