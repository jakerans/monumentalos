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
import { Settings, Trophy } from 'lucide-react';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goalsOpen, setGoalsOpen] = useState(false);

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

  // Scoped date range: fetch only last 60 days of transactional data
  const fetchStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];

  const { data: clients = [], isLoading: l1 } = useQuery({ queryKey: ['admin-clients'], queryFn: () => base44.entities.Client.list(), staleTime: 5 * 60 * 1000 });
  const { data: leads = [], isLoading: l2 } = useQuery({ queryKey: ['admin-leads', fetchStart], queryFn: () => base44.entities.Lead.filter({ created_date: { $gte: fetchStart } }, '-created_date', 5000), staleTime: 2 * 60 * 1000 });
  const { data: spend = [], isLoading: l3 } = useQuery({ queryKey: ['admin-spend', fetchStart], queryFn: () => base44.entities.Spend.filter({ date: { $gte: fetchStart } }, '-date', 5000), staleTime: 2 * 60 * 1000 });
  const { data: payments = [], isLoading: l4 } = useQuery({ queryKey: ['admin-payments', fetchStart], queryFn: () => base44.entities.Payment.filter({ date: { $gte: fetchStart } }, '-date', 5000), staleTime: 2 * 60 * 1000 });
  const { data: expenses = [], isLoading: l5 } = useQuery({ queryKey: ['admin-expenses', fetchStart], queryFn: () => base44.entities.Expense.filter({ date: { $gte: fetchStart } }, '-date', 1000), staleTime: 2 * 60 * 1000 });
  const { data: goals = [], refetch: refetchGoals } = useQuery({ queryKey: ['admin-goals'], queryFn: () => base44.entities.CompanyGoal.list(), staleTime: 10 * 60 * 1000 });
  const { data: billingRecords = [] } = useQuery({ queryKey: ['admin-billing'], queryFn: () => base44.entities.MonthlyBilling.list('-billing_month', 100), staleTime: 5 * 60 * 1000 });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list(), staleTime: 5 * 60 * 1000 });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const currentGoal = goals.find(g => g.month === currentMonth);
  const lastMonthBilling = billingRecords.filter(b => b.billing_month === lastMonth);

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
  const setters = users.filter(u => u.app_role === 'setter');
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const setterStats = setters.map(setter => {
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    const stlLeads = leads.filter(l => l.setter_id === setter.id && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
    const avgSTL = stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
    return { name: setter.full_name, booked, avgSTL };
  }).sort((a, b) => b.booked - a.booked);

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading dashboard..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="AdminDashboard" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Dashboard</h1>
            <p className="text-sm text-slate-400">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })} overview
            </p>
          </div>
          <button onClick={() => setGoalsOpen(true)} className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity text-black" style={{backgroundColor:'#D6FF03'}}>
            <Settings className="w-3.5 h-3.5" /> Manage Goals
          </button>
        </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ClientGoalChart clients={clients} />
          <RevenueBreakdownChart clients={clients} leads={leads} spend={spend} />
          <MTDGoalProgress currentGoal={currentGoal} mtdData={mtd} />
        </div>

        {/* P&L + Setter Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* P&L Snapshot */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <h3 className="text-sm font-bold text-white mb-3">P&L Snapshot (MTD)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Gross Revenue', value: mtd.grossRevenue, color: 'text-blue-400' },
                { label: 'Cash Collected', value: mtd.collected, color: 'text-emerald-400' },
                { label: 'COGS', value: mtd.cogs, color: 'text-orange-400', negative: true },
                { label: 'Overhead', value: mtd.overhead, color: 'text-red-400', negative: true },
                { label: 'Gross Profit', value: mtd.grossProfit, color: 'text-purple-400' },
                { label: 'Net Profit', value: mtd.netProfit, color: mtd.netProfit >= 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'Gross Margin', value: null, display: `${mtd.grossMargin.toFixed(1)}%`, color: 'text-indigo-400' },
                { label: 'Net Margin', value: null, display: `${mtd.netMargin.toFixed(1)}%`, color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>
                    {item.display || `${item.negative ? '-' : ''}$${Math.abs(item.value).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Setter leaderboard */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Setter Leaderboard (MTD)</h3>
            </div>
            <div className="divide-y divide-slate-700/30">
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
                    {s.avgSTL != null && (
                      <span className="text-[10px] text-slate-400">{s.avgSTL}m STL</span>
                    )}
                    <span className="text-xs font-bold" style={{color:'#D6FF03'}}>{s.booked} booked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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