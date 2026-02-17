import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import DashboardKPIs from '../components/admin/DashboardKPIs';
import ClientOverviewTable from '../components/admin/ClientOverviewTable';
import AddPaymentModal from '../components/admin/AddPaymentModal';
import AddExpenseModal from '../components/admin/AddExpenseModal';
import { DollarSign, Receipt } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role === 'marketing_manager') { navigate(createPageUrl('MMDashboard')); return; }
        if (currentUser.role === 'onboard_admin') { navigate(createPageUrl('OnboardDashboard')); return; }
        if (currentUser.role !== 'admin') { navigate(createPageUrl('SetterDashboard')); }
      } catch (error) { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 5000),
  });

  const { data: spend = [] } = useQuery({
    queryKey: ['admin-spend'],
    queryFn: () => base44.entities.Spend.list('-date', 5000),
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => base44.entities.Payment.list('-date', 5000),
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['admin-expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  if (!user) return null;

  // Recent activity feed
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const recentPayments = payments.filter(p => new Date(p.date) >= thisMonthStart).slice(0, 5);
  const recentExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart).slice(0, 5);

  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const setters = users.filter(u => u.role === 'setter');
  const setterStats = setters.map(setter => {
    const sLeads = leads.filter(l => l.setter_id === setter.id && new Date(l.created_date) >= thisMonthStart);
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart);
    return { name: setter.full_name, calls: sLeads.length, booked: booked.length };
  }).sort((a, b) => b.booked - a.booked);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} currentPage="AdminDashboard" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time overview of operations</p>
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

        <DashboardKPIs clients={clients} leads={leads} spend={spend} payments={payments} />

        <ClientOverviewTable clients={clients} leads={leads} spend={spend} payments={payments} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Payments */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Recent Payments</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentPayments.length === 0 ? (
                <div className="px-4 py-4 text-xs text-gray-400 text-center">No payments this month</div>
              ) : recentPayments.map(p => (
                <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{getClientName(p.client_id)}</p>
                    <p className="text-[10px] text-gray-400">{p.date} · {p.method?.toUpperCase()}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+${p.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Recent Expenses</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentExpenses.length === 0 ? (
                <div className="px-4 py-4 text-xs text-gray-400 text-center">No expenses this month</div>
              ) : recentExpenses.map(e => (
                <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{e.description || e.category}</p>
                    <p className="text-[10px] text-gray-400">{e.date} · {e.vendor || '—'}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">-${e.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Setter Leaderboard */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Setter Leaderboard (MTD)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {setterStats.length === 0 ? (
                <div className="px-4 py-4 text-xs text-gray-400 text-center">No setters found</div>
              ) : setterStats.map((s, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                    <span className="text-xs font-medium text-gray-900">{s.name}</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-gray-500">{s.calls} calls</span>
                    <span className="font-bold text-blue-600">{s.booked} booked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AddPaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} clients={clients} onCreated={refetchPayments} />
      <AddExpenseModal open={expenseOpen} onOpenChange={setExpenseOpen} clients={clients} onCreated={refetchExpenses} />
    </div>
  );
}