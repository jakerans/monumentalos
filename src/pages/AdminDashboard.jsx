import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import BusinessHealthKPIs from '../components/admin/BusinessHealthKPIs';
import CashHealthPanel from '../components/admin/CashHealthPanel';
import ClientGoalChart from '../components/admin/ClientGoalChart';
import RevenueBreakdownChart from '../components/admin/RevenueBreakdownChart';
import MTDGoalProgress from '../components/admin/MTDGoalProgress';
import GoalManagementModal from '../components/admin/GoalManagementModal';
import PLComparisonRow from '../components/admin/PLComparisonRow.jsx';
import StatCompareCard from '../components/admin/StatCompareCard.jsx';
import { Settings, Trophy } from 'lucide-react';
import InfoTooltip from '../components/shared/InfoTooltip';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import AdminDashboardSkeleton from '../components/admin/AdminDashboardSkeleton';
import BugReportWidget from '../components/shared/BugReportWidget';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { getEffectsEnabled } from '../components/shared/useEffectsToggle';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const effectsOn = getEffectsEnabled();
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
        if (appRole === 'finance_admin') { navigate(createPageUrl('FinanceAdminDashboard')); return; }
        if (appRole !== 'admin') { navigate(createPageUrl('AccountPending')); }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const retryConfig = { retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) };

  // Single backend call for all dashboard data
  const { data: dashData, isLoading, refetch: refetchDash } = useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAdminDashboardData');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    ...retryConfig,
  });

  const healthKPIs = dashData?.healthKPIs || {};
  const cashHealth = dashData?.cashHealth || null;
  const goalChartData = dashData?.goalChartData || { counts: {}, total: 0, healthyPct: 0 };
  const revenueBreakdown = dashData?.revenueBreakdown || {};
  const mtd = dashData?.mtdPL || { grossRevenue: 0, collected: 0, cogs: 0, overhead: 0, grossProfit: 0, netProfit: 0, grossMargin: 0, netMargin: 0 };
  const priorPL = dashData?.priorPL || mtd;
  const statCompare = dashData?.statCompare || {};
  const setterStats = dashData?.setterStats || [];
  const currentGoal = dashData?.currentGoal || null;
  const goals = dashData?.goals || [];
  const clients = dashData?.clients || [];
  const spiffs = dashData?.spiffs || [];

  const [leaderboardRef] = useAutoAnimate({ duration: 300, easing: 'ease-out' });

  if (!user) return null;
  if (isLoading) return <AdminDashboardSkeleton />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="AdminDashboard" clients={clients} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Company Dashboard Header — fixed at top */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-700/50 bg-slate-900/30 sticky top-0 z-10">
          <motion.div
            initial={effectsOn ? { opacity: 0, y: 16 } : false}
            animate={effectsOn ? { opacity: 1, y: 0 } : false}
            transition={effectsOn ? { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }}
            className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div>
              <h1 className="text-2xl font-bold text-white">Company Dashboard</h1>
              <p className="text-sm text-slate-400">
                {now.toLocaleString('default', { month: 'long', year: 'numeric' })} overview
              </p>
            </div>
            <motion.button
              whileHover={effectsOn ? { scale: 1.05 } : {}}
              whileTap={effectsOn ? { scale: 0.95 } : {}}
              onClick={() => setGoalsOpen(true)}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity text-black ${effectsOn ? 'glow-pulse' : ''}`}
              style={{backgroundColor:'#D6FF03'}}
            >
              <Settings className="w-3.5 h-3.5" /> Manage Goals
            </motion.button>
          </motion.div>
        </div>

        {/* Content area */}
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Cash Health Panel — priority */}
          <CashHealthPanel data={cashHealth} />

          {/* Business Health KPIs */}
          <BusinessHealthKPIs data={healthKPIs} />

          {/* Charts row */}
          <motion.div
            initial={effectsOn ? { opacity: 0, y: 20 } : false}
            animate={effectsOn ? { opacity: 1, y: 0 } : false}
            transition={effectsOn ? { delay: 0.2, duration: 0.4 } : { duration: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch"
          >
            <ClientGoalChart data={goalChartData} />
            <RevenueBreakdownChart data={revenueBreakdown} />
            <MTDGoalProgress currentGoal={currentGoal} mtdData={mtd} />
          </motion.div>

          {/* P&L Snapshot — full width */}
          <motion.div
            initial={effectsOn ? { opacity: 0, y: 20 } : false}
            animate={effectsOn ? { opacity: 1, y: 0 } : false}
            transition={effectsOn ? { delay: 0.3, duration: 0.4 } : { duration: 0 }}
            className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-white">P&L Snapshot (MTD vs Last Month)</h3>
              <InfoTooltip text="Side-by-side comparison of this month's P&L metrics versus last month. Green/red badges show the % change. COGS and Overhead are inverted — decreases are good." />
            </div>
            <PLComparisonRow current={mtd} prior={priorPL} />
          </motion.div>

          {/* Stat Compare */}
          <motion.div
            initial={effectsOn ? { opacity: 0, y: 20 } : false}
            animate={effectsOn ? { opacity: 1, y: 0 } : false}
            transition={effectsOn ? { delay: 0.35, duration: 0.4 } : { duration: 0 }}
          >
            <StatCompareCard data={statCompare} />
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
        </div>
      </main>

      <GoalManagementModal open={goalsOpen} onOpenChange={setGoalsOpen} goals={goals} onSaved={refetchDash} />
      <AdminMobileNav currentPage="AdminDashboard" clients={clients} user={user} />

      <BugReportWidget user={user} />
    </div>
    </PageErrorBoundary>
  );
}