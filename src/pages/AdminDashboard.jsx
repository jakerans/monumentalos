import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import DashboardKPIs from '../components/admin/DashboardKPIs';
import GoalProgressCard from '../components/admin/GoalProgressCard';
import SetGoalsModal from '../components/admin/SetGoalsModal';
import CompactClientOverview from '../components/admin/CompactClientOverview';
import AddPaymentModal from '../components/admin/AddPaymentModal';
import AddExpenseModal from '../components/admin/AddExpenseModal';
import { DollarSign, Receipt, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role === 'marketing_manager') { navigate(createPageUrl('MMDashboard')); return; }
        if (currentUser.role === 'onboard_admin') { navigate(createPageUrl('OnboardDashboard')); return; }
        if (currentUser.role !== 'admin') { navigate(createPageUrl('SetterDashboard')); }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [] } = useQuery({ queryKey: ['admin-clients'], queryFn: () => base44.entities.Client.list() });
  const { data: leads = [] } = useQuery({ queryKey: ['admin-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 5000) });
  const { data: spend = [] } = useQuery({ queryKey: ['admin-spend'], queryFn: () => base44.entities.Spend.list('-date', 5000) });
  const { data: payments = [], refetch: refetchPayments } = useQuery({ queryKey: ['admin-payments'], queryFn: () => base44.entities.Payment.list('-date', 5000) });
  const { data: expenses = [], refetch: refetchExpenses } = useQuery({ queryKey: ['admin-expenses'], queryFn: () => base44.entities.Expense.list('-date', 200) });
  const { data: goals = [], refetch: refetchGoals } = useQuery({ queryKey: ['admin-goals'], queryFn: () => base44.entities.CompanyGoal.list() });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list() });

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentGoal = goals.find(g => g.month === currentMonth);

  const mtd = useMemo(() => {
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= mtdStart && dt <= mtdEnd; };

    let grossRevenue = 0;
    clients.filter(c => c.status === 'active').forEach(client => {
      const bt = client.billing_type || 'pay_per_show';
      const cLeads = leads.filter(l => l.client_id === client.id);
      if (bt === 'pay_per_show') {
        grossRevenue += cLeads.filter(l => l.disposition === 'showed' && inRange(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
      } else if (bt === 'pay_per_set') {
        grossRevenue += cLeads.filter(l => l.date_appointment_set && inRange(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
      } else if (bt === 'retainer') {
        grossRevenue += (client.retainer_amount || 0);
      }
    });

    const collected = payments.filter(p => inRange(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
    const rangeExpenses = expenses.filter(e => inRange(e.date));
    const cogs = rangeExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
    const overhead = rangeExpenses.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
    const grossProfit = grossRevenue - cogs;
    const netProfit = collected - cogs - overhead;
    const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netMargin = collected > 0 ? (netProfit / collected) * 100 : 0;

    return { grossRevenue, collected, cogs, overhead, grossProfit, netProfit, grossMargin, netMargin };
  }, [clients, leads, payments, expenses]);

  // Setter leaderboard
  const setters = users.filter(u => u.role === 'setter');
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const setterStats = setters.map(setter => {
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    return { name: setter.full_name, booked };
  }).sort((a, b) => b.booked - a.booked);

  if (!user) return null;

  const hasGoal = currentGoal && (currentGoal.gross_revenue_goal || currentGoal.cash_collected_goal || currentGoal.net_profit_goal);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} currentPage="AdminDashboard" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
            <p className="text-sm text-gray-500">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })} overview
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGoalsOpen(true)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" /> Goals
            </button>
            <button onClick={() => setPaymentOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Record Payment
            </button>
            <button onClick={() => setExpenseOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        </div>

        {/* High-level KPIs */}
        <DashboardKPIs clients={clients} leads={leads} spend={spend} payments={payments} />

        {/* Goal progress */}
        {hasGoal && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Monthly Goal Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {currentGoal.gross_revenue_goal > 0 && (
                <GoalProgressCard label="Gross Revenue" current={mtd.grossRevenue} goal={currentGoal.gross_revenue_goal} color="blue" />
              )}
              {currentGoal.cash_collected_goal > 0 && (
                <GoalProgressCard label="Cash Collected" current={mtd.collected} goal={currentGoal.cash_collected_goal} color="emerald" />
              )}
              {currentGoal.gross_margin_goal > 0 && (
                <GoalProgressCard label="Gross Margin" current={mtd.grossMargin} goal={currentGoal.gross_margin_goal} format="percent" color="purple" />
              )}
              {currentGoal.net_margin_goal > 0 && (
                <GoalProgressCard label="Net Margin" current={mtd.netMargin} goal={currentGoal.net_margin_goal} format="percent" color="indigo" />
              )}
              {currentGoal.net_profit_goal > 0 && (
                <GoalProgressCard label="Net Profit" current={mtd.netProfit} goal={currentGoal.net_profit_goal} color="green" />
              )}
            </div>
          </div>
        )}

        {!hasGoal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-blue-700 text-xs font-medium">Set monthly goals to track progress toward key financial KPIs.</span>
            <button onClick={() => setGoalsOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Set Goals
            </button>
          </div>
        )}

        {/* Financial snapshot + Setter leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CompactClientOverview clients={clients} leads={leads} spend={spend} />
          </div>
          <div className="space-y-4">
            {/* Financial snapshot card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">P&L Snapshot (MTD)</h3>
              <div className="space-y-2">
                {[
                  { label: 'Gross Revenue', value: mtd.grossRevenue, color: 'text-blue-600' },
                  { label: 'COGS', value: -mtd.cogs, color: 'text-orange-600' },
                  { label: 'Gross Profit', value: mtd.grossProfit, color: 'text-purple-600', bold: true },
                  { label: 'Overhead', value: -mtd.overhead, color: 'text-red-600' },
                  { label: 'Cash Collected', value: mtd.collected, color: 'text-emerald-600' },
                  { label: 'Net Profit', value: mtd.netProfit, color: mtd.netProfit >= 0 ? 'text-green-600' : 'text-red-600', bold: true },
                ].map(item => (
                  <div key={item.label} className={`flex justify-between text-xs ${item.bold ? 'font-bold border-t border-gray-100 pt-1.5' : ''}`}>
                    <span className="text-gray-600">{item.label}</span>
                    <span className={item.color}>{item.value < 0 ? '-' : ''}${Math.abs(item.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setter leaderboard */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Setter Leaderboard (MTD)</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {setterStats.length === 0 ? (
                  <div className="px-4 py-4 text-xs text-gray-400 text-center">No setters found</div>
                ) : setterStats.slice(0, 5).map((s, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <span className="text-xs font-medium text-gray-900">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600">{s.booked} booked</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SetGoalsModal open={goalsOpen} onOpenChange={setGoalsOpen} currentGoal={currentGoal} month={currentMonth} onSaved={refetchGoals} />
      <AddPaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} clients={clients} onCreated={refetchPayments} />
      <AddExpenseModal open={expenseOpen} onOpenChange={setExpenseOpen} clients={clients} onCreated={refetchExpenses} />
    </div>
  );
}