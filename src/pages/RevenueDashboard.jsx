import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import { DollarSign, Receipt, BarChart3, TrendingUp, Users } from 'lucide-react';
import AdminNav from '../components/admin/AdminNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import AccountingKPIs from '../components/admin/AccountingKPIs';
import RevenueClientTable from '../components/admin/RevenueClientTable';
import MonthlyPLChart from '../components/admin/MonthlyPLChart';
import ExpenseBreakdown from '../components/admin/ExpenseBreakdown';
import PaymentLedger from '../components/admin/PaymentLedger';
import CashFlowAnalysis from '../components/admin/CashFlowAnalysis';
import AddPaymentModal from '../components/admin/AddPaymentModal';
import AddExpenseModal from '../components/admin/AddExpenseModal';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

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

  // Scope fetches to selected date range (with buffer for prior period comparisons)
  const revFetchStart = dayjs(startDate).subtract(6, 'month').format('YYYY-MM-DD');

  const { data: clients = [], isLoading: l1 } = useQuery({ queryKey: ['rev-clients'], queryFn: () => base44.entities.Client.list(), staleTime: 5 * 60 * 1000 });
  const { data: leads = [], isLoading: l2 } = useQuery({ queryKey: ['rev-leads', revFetchStart], queryFn: () => base44.entities.Lead.filter({ created_date: { $gte: revFetchStart } }, '-created_date', 5000), staleTime: 2 * 60 * 1000 });
  const { data: payments = [], refetch: refetchPayments, isLoading: l3 } = useQuery({ queryKey: ['rev-payments', revFetchStart], queryFn: () => base44.entities.Payment.filter({ date: { $gte: revFetchStart } }, '-date', 5000), staleTime: 2 * 60 * 1000 });
  const { data: expenses = [], refetch: refetchExpenses, isLoading: l4 } = useQuery({ queryKey: ['rev-expenses', revFetchStart], queryFn: () => base44.entities.Expense.filter({ date: { $gte: revFetchStart } }, '-date', 5000), staleTime: 2 * 60 * 1000 });

  const isLoading = l1 || l2 || l3 || l4;

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading accounting..." />;

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
            <AccountingKPIs clients={clients} leads={leads} payments={payments} expenses={expenses} startDate={startDate} endDate={endDate} />
            <MonthlyPLChart clients={clients} leads={leads} payments={payments} expenses={expenses} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentLedger payments={payments} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchPayments} />
              <ExpenseBreakdown expenses={expenses} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchExpenses} />
            </div>
          </div>
        )}

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <CashFlowAnalysis payments={payments} expenses={expenses} />
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <RevenueClientTable clients={clients} leads={leads} payments={payments} />
        )}
      </main>

      <AddPaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} clients={clients} onCreated={refetchPayments} />
      <AddExpenseModal open={expenseOpen} onOpenChange={setExpenseOpen} clients={clients} onCreated={refetchExpenses} />
    </div>
    </PageErrorBoundary>
  );
}