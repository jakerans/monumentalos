import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DollarSign, Receipt } from 'lucide-react';
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

export default function RevenueDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

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

  const { data: clients = [] } = useQuery({ queryKey: ['rev-clients'], queryFn: () => base44.entities.Client.list() });
  const { data: leads = [] } = useQuery({ queryKey: ['rev-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 5000) });
  const { data: payments = [], refetch: refetchPayments } = useQuery({ queryKey: ['rev-payments'], queryFn: () => base44.entities.Payment.list('-date', 5000) });
  const { data: expenses = [], refetch: refetchExpenses } = useQuery({ queryKey: ['rev-expenses'], queryFn: () => base44.entities.Expense.list('-date', 5000) });

  if (!user) return null;

  return (
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

        <div className="flex gap-2 justify-end">
          <button onClick={() => setPaymentOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Record Payment
          </button>
          <button onClick={() => setExpenseOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" /> Add Expense
          </button>
        </div>

        <AccountingKPIs clients={clients} leads={leads} payments={payments} expenses={expenses} startDate={startDate} endDate={endDate} />

        <MonthlyPLChart clients={clients} leads={leads} payments={payments} expenses={expenses} />

        <CashFlowAnalysis payments={payments} expenses={expenses} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentLedger payments={payments} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchPayments} />
          <ExpenseBreakdown expenses={expenses} clients={clients} startDate={startDate} endDate={endDate} onRefresh={refetchExpenses} />
        </div>

        <RevenueClientTable clients={clients} leads={leads} payments={payments} />
      </main>

      <AddPaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} clients={clients} onCreated={refetchPayments} />
      <AddExpenseModal open={expenseOpen} onOpenChange={setExpenseOpen} clients={clients} onCreated={refetchExpenses} />
    </div>
  );
}