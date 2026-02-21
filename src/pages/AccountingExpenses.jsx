import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import { Receipt, RefreshCw, Banknote } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import ExpenseManager from '../components/admin/ExpenseManager';
import AddExpenseModal from '../components/admin/AddExpenseModal';
import RunPayrollModal from '../components/admin/RunPayrollModal';
import MonthlyClosePanel from '../components/admin/MonthlyClosePanel';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import RevenueDashboardSkeleton from '../components/admin/RevenueDashboardSkeleton';

export default function AccountingExpenses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  const handleSyncExpenses = async () => {
    setSyncing(true);
    const res = await base44.functions.invoke('syncExpensesSheet');
    setSyncing(false);
    const s = res.data?.stats || {};
    toast({ title: 'Expense Sync Complete', description: `Imported: ${s.imported || 0}, Updated from sheet: ${s.updatedFromSheet || 0}, Pushed to sheet: ${s.updatedToSheet || 0}`, variant: 'success' });
    refetchAll();
  };

  if (!user) return null;
  if (isLoading) return <RevenueDashboardSkeleton />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="AccountingExpenses" clients={clients} />
        <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <MonthlyClosePanel />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Expenses</h1>
              <p className="text-sm text-slate-400">Manage, categorize, and sync expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setExpenseOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Add Expense
            </button>
            <button onClick={handleSyncExpenses} disabled={syncing} className="px-3 py-1.5 text-xs font-medium bg-slate-700 text-white rounded-md hover:bg-slate-600 disabled:opacity-50 flex items-center gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Sheet'}
            </button>
            {user?.app_role === 'admin' && (
              <button onClick={() => setPayrollOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" /> Run Payroll
              </button>
            )}
          </div>

          <ExpenseManager startDate={startDate} endDate={endDate} onAddExpense={() => setExpenseOpen(true)} />
        </main>

        <AddExpenseModal open={expenseOpen} onOpenChange={setExpenseOpen} clients={clients} onCreated={refetchAll} />
        <RunPayrollModal open={payrollOpen} onOpenChange={setPayrollOpen} onComplete={refetchAll} />
        <AdminMobileNav currentPage="AccountingExpenses" clients={clients} />
      </div>
    </PageErrorBoundary>
  );
}