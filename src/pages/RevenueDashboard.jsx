import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import { DollarSign, Receipt, BarChart3, TrendingUp, Users, Wallet } from 'lucide-react';
import AdminNav from '../components/admin/AdminNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import AccountingKPIs from '../components/admin/AccountingKPIs';
import RevenueClientTable from '../components/admin/RevenueClientTable';
import MonthlyPLChart from '../components/admin/MonthlyPLChart';
import ExpenseBreakdown from '../components/admin/ExpenseBreakdown';
import PaymentLedger from '../components/admin/PaymentLedger';
import CashFlowAnalysis from '../components/admin/CashFlowAnalysis';
import ExpenseManager from '../components/admin/ExpenseManager';
import AddPaymentModal from '../components/admin/AddPaymentModal';
import AddExpenseModal from '../components/admin/AddExpenseModal';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import RevenueDashboardSkeleton from '../components/admin/RevenueDashboardSkeleton';

export default function RevenueDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pl');

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

  const { data: dashData, isLoading, refetch: refetchDash } = useQuery({
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
  const rawPayments = dashData?.payments || [];
  const expenses = dashData?.expenses || [];
  const billingRecords = dashData?.billingRecords || [];
  const monthlyPL = dashData?.monthlyPL || [];
  const cashFlowData = dashData?.cashFlowData || [];
  const kpis = dashData?.kpis || null;
  const clientSummary = dashData?.clientSummary || [];

  // Merge Payment entity records + paid MonthlyBilling into a unified "payments" list for ledger & sparklines
  const payments = React.useMemo(() => {
    const fromPayments = rawPayments.map(p => ({ ...p, _source: 'payment' }));
    const fromBilling = billingRecords.map(b => ({
      id: b.id,
      client_id: b.client_id,
      amount: b.paid_amount || b.calculated_amount || 0,
      date: b.paid_date,
      method: 'invoice',
      notes: `Invoice ${b.invoice_id || ''} (${b.billing_month})`,
      _source: 'billing',
    }));
    return [...fromPayments, ...fromBilling];
  }, [rawPayments, billingRecords]);

  const refetchPayments = refetchDash;
  const refetchExpenses = refetchDash;

  if (!user) return null;
  if (isLoading) return <RevenueDashboardSkeleton />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="RevenueDashboard" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Accounting</h1>
            <p className="text-sm text-slate-400">P&L, billing breakdown, payments & expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          </div>
        </div>

        {/* Tab bar + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            {[
              { key: 'pl', label: 'P&L', icon: BarChart3 },
              { key: 'expenses', label: 'Expenses', icon: Wallet },
              { key: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
              { key: 'clients', label: 'Clients', icon: Users },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#D6FF03] text-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPaymentOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Record Payment
            </button>
            <button onClick={() => setExpenseOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        </div>

        {/* P&L Tab */}
        {activeTab === 'pl' && (
          <div className="space-y-5">
            <AccountingKPIs kpis={kpis} payments={payments} expenses={expenses} />
            <MonthlyPLChart data={monthlyPL} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentLedger payments={payments} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchPayments} />
              <ExpenseBreakdown expenses={expenses} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchExpenses} />
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <ExpenseManager startDate={startDate} endDate={endDate} onAddExpense={() => setExpenseOpen(true)} />
        )}

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <CashFlowAnalysis cashFlowData={cashFlowData} />
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <RevenueClientTable clients={clients} clientSummary={clientSummary} />
        )}
      </main>

      <AddPaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} clients={clients} onCreated={refetchPayments} />
      <AddExpenseModal open={expenseOpen} onOpenChange={setExpenseOpen} clients={clients} onCreated={refetchExpenses} />
    </div>
    </PageErrorBoundary>
  );
}