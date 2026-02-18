import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import BusinessHealthKPIs from '../components/admin/BusinessHealthKPIs';
import ClientGoalChart from '../components/admin/ClientGoalChart';
import RevenueBreakdownChart from '../components/admin/RevenueBreakdownChart';
import MTDGoalProgress from '../components/admin/MTDGoalProgress';
import GoalManagementModal from '../components/admin/GoalManagementModal';
import PLComparisonRow from '../components/admin/PLComparisonRow.jsx';
import StatCompareCard from '../components/admin/StatCompareCard.jsx';
import dayjs from 'dayjs';
import { Settings, Trophy } from 'lucide-react';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const now = new Date();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole === 'marketing_manager') { navigate(createPageUrl('MMDashboard')); return; }
        if (appRole === 'onboard_admin') { navigate(createPageUrl('OnboardDashboard')); return; }
        if (appRole === 'setter') { navigate(createPageUrl('SetterDashboard')); return; }
        if (appRole === 'client') { navigate(createPageUrl('ClientPortal')); return; }
        if (appRole !== 'admin') { navigate(createPageUrl('AccountPending')); }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const retryConfig = { retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) };
  const { data: clients = [], isLoading: l1 } = useQuery({ queryKey: ['admin-clients'], queryFn: () => base44.entities.Client.list(), staleTime: 5 * 60 * 1000, ...retryConfig });
  const { data: leads = [], isLoading: l2 } = useQuery({ queryKey: ['admin-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 5000), staleTime: 2 * 60 * 1000, ...retryConfig });
  const { data: spend = [], isLoading: l3 } = useQuery({ queryKey: ['admin-spend'], queryFn: () => base44.entities.Spend.list('-date', 5000), staleTime: 2 * 60 * 1000, ...retryConfig });
  const { data: payments = [], isLoading: l4 } = useQuery({ queryKey: ['admin-payments'], queryFn: () => base44.entities.Payment.list('-date', 5000), staleTime: 2 * 60 * 1000, ...retryConfig });
  const { data: expenses = [], isLoading: l5 } = useQuery({ queryKey: ['admin-expenses'], queryFn: () => base44.entities.Expense.list('-date', 1000), staleTime: 2 * 60 * 1000, ...retryConfig });
  const { data: goals = [], refetch: refetchGoals } = useQuery({ queryKey: ['admin-goals'], queryFn: () => base44.entities.CompanyGoal.list(), staleTime: 10 * 60 * 1000, ...retryConfig });
  const { data: billingRecords = [] } = useQuery({ queryKey: ['admin-billing'], queryFn: () => base44.entities.MonthlyBilling.list('-billing_month', 100), staleTime: 5 * 60 * 1000, ...retryConfig });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list(), staleTime: 5 * 60 * 1000, ...retryConfig });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const currentMonth = dayjs().format('YYYY-MM');
  const lastMonth = dayjs().subtract(1, 'month').format('YYYY-MM');

  const currentGoal = goals.find(g => g.month === currentMonth);
  const lastMonthBilling = billingRecords.filter(b => b.billing_month === lastMonth);

  const mtd = useMemo(() => {
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= mtdStart && dt <= mtdEnd; };
    const inLM = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lmStart && dt <= lmEnd; };

    const calcPeriod = (rangeFn) => {
      let grossRevenue = 0;
      clients.filter(c => c.status === 'active').forEach(client => {
        const bt = client.billing_type || 'pay_per_show';
        const cLeads = leads.filter(l => l.client_id === client.id);
        if (bt === 'pay_per_show') {
          grossRevenue += cLeads.filter(l => l.disposition === 'showed' && rangeFn(l.appointment_date)).length * (client.price_per_shown_appointment || 0);
        } else if (bt === 'pay_per_set') {
          grossRevenue += cLeads.filter(l => l.date_appointment_set && rangeFn(l.date_appointment_set)).length * (client.price_per_set_appointment || 0);
        } else if (bt === 'retainer') {
          grossRevenue += (client.retainer_amount || 0);
        }
      });
      const collected = payments.filter(p => rangeFn(p.date)).reduce((s, p) => s + (p.amount || 0), 0);
      const rangeExpenses = expenses.filter(e => rangeFn(e.date));
      const cogs = rangeExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const overhead = rangeExpenses.filter(e => e.expense_type !== 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
      const grossProfit = grossRevenue - cogs;
      const netProfit = collected - cogs - overhead;
      const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
      const netMargin = collected > 0 ? (netProfit / collected) * 100 : 0;
      return { grossRevenue, collected, cogs, overhead, grossProfit, netProfit, grossMargin, netMargin };
    };

    const current = calcPeriod(inRange);
    const prior = calcPeriod(inLM);
    return { ...current, prior };
  }, [clients, leads, payments, expenses]);

  // Setter leaderboard
  const setters = users.filter(u => u.app_role === 'setter');
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const setterStats = setters.map(setter => {
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    const stlLeads = leads.filter(l => l.setter_id === setter.id && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
    const avgSTL = stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
    return { name: setter.full_name, booked, avgSTL };
  }).sort((a, b) => b.booked - a.booked);

  const [leaderboardRef] = useAutoAnimate({ duration: 300, easing: 'ease-out' });

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading dashboard..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="AdminDashboard" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Company Dashboard</h1>
            <p className="text-sm text-slate-400">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })} overview
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGoalsOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity text-black glow-pulse"
            style={{backgroundColor:'#D6FF03'}}
          >
            <Settings className="w-3.5 h-3.5" /> Manage Goals
          </motion.button>
        </motion.div>

        {/* Business Health KPIs */}
        <BusinessHealthKPIs
          clients={clients}
          leads={leads}
          spend={spend}
          payments={payments}
          billingRecords={billingRecords}
          lastMonthBilling={lastMonthBilling}
        />

        {/* Charts row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <ClientGoalChart clients={clients} />
          <RevenueBreakdownChart clients={clients} leads={leads} spend={spend} />
          <MTDGoalProgress currentGoal={currentGoal} mtdData={mtd} />
        </motion.div>

        {/* P&L Snapshot — full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4"
        >
          <h3 className="text-sm font-bold text-white mb-3">P&L Snapshot (MTD vs Last Month)</h3>
          <PLComparisonRow current={mtd} prior={mtd.prior} />
        </motion.div>

        {/* Stat Compare + Setter Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Income vs Expenses */}
          <StatCompareCard payments={payments} expenses={expenses} leads={leads} clients={clients} />

          {/* Setter leaderboard */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Setter Leaderboard (MTD)</h3>
            </div>
            <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-700/30">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Setter</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider min-w-[40px] text-right">STL</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider min-w-[55px] text-right">Booked</span>
              </div>
            </div>
            <div ref={leaderboardRef} className="divide-y divide-slate-700/30">
              {setterStats.length === 0 ? (
                <div className="px-4 py-6 text-xs text-slate-500 text-center">No setters found</div>
              ) : setterStats.slice(0, 8).map((s, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-600 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
                    }`}>{i + 1}</span>
                    <span className="text-xs font-medium text-slate-200">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 min-w-[40px] text-right">{s.avgSTL != null ? `${s.avgSTL}m` : '—'}</span>
                    <span className="text-xs font-bold min-w-[55px] text-right" style={{color:'#D6FF03'}}>{s.booked} booked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* No goal prompt */}
        {!currentGoal && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">No goals set for {now.toLocaleString('default', { month: 'long' })}</p>
              <p className="text-xs text-slate-400 mt-0.5">Set monthly targets to track progress toward revenue, margins, and profit.</p>
            </div>
            <button onClick={() => setGoalsOpen(true)} className="px-4 py-2 text-xs font-bold text-black rounded-lg hover:opacity-90" style={{backgroundColor:'#D6FF03'}}>
              Set Goals
            </button>
          </div>
        )}
      </main>

      <GoalManagementModal open={goalsOpen} onOpenChange={setGoalsOpen} goals={goals} onSaved={refetchGoals} />
    </div>
    </PageErrorBoundary>
  );
}