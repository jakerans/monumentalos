import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import BusinessHealthKPIs from '../components/admin/BusinessHealthKPIs';
import CashHealthPanel from '../components/admin/CashHealthPanel';
import ClientGoalChart from '../components/admin/ClientGoalChart';
import RevenueBreakdownChart from '../components/admin/RevenueBreakdownChart';
import MTDGoalProgress from '../components/admin/MTDGoalProgress';
import GoalManagementModal from '../components/admin/GoalManagementModal';
import PLComparisonRow from '../components/admin/PLComparisonRow.jsx';
import StatCompareCard from '../components/admin/StatCompareCard.jsx';
import { Settings, Trophy, Eye, RefreshCw, Sparkles } from 'lucide-react';
import AICoachInstructionsModal from '../components/admin/AICoachInstructionsModal';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import AdminDashboardSkeleton from '../components/admin/AdminDashboardSkeleton';
import { toast } from '@/components/ui/use-toast';
import MMPerformanceGoal from '../components/mm/MMPerformanceGoal';
import RankPreviewTester from '../components/mm/RankPreviewTester';
import SpiffPreviewTester from '../components/admin/SpiffPreviewTester';
import STLPreviewTester from '../components/admin/STLPreviewTester';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { getEffectsEnabled } from '../components/shared/useEffectsToggle';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [showPerfTester, setShowPerfTester] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
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
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="AdminDashboard" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div
          initial={effectsOn ? { opacity: 0, y: 16 } : false}
          animate={effectsOn ? { opacity: 1, y: 0 } : false}
          transition={effectsOn ? { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Company Dashboard</h1>
            <p className="text-sm text-slate-400">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })} overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={effectsOn ? { scale: 1.05 } : {}}
              whileTap={effectsOn ? { scale: 0.95 } : {}}
              onClick={async () => {
                setSyncing(true);
                try {
                  const res = await base44.functions.invoke('syncClientsSheet');
                  const d = res.data;
                  toast({ title: 'Sheet Synced', description: `Sheet: +${d.sheetCreated} new, ${d.sheetUpdated} updated · DB: +${d.dbCreated} new, ${d.dbUpdated} updated`, variant: 'success' });
                } catch (e) {
                  toast({ title: 'Sync Failed', description: e.message, variant: 'destructive' });
                }
                setSyncing(false);
              }}
              disabled={syncing}
              className="px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border bg-slate-800 border-slate-700 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Sheet'}
            </motion.button>
            <motion.button
              whileHover={effectsOn ? { scale: 1.05 } : {}}
              whileTap={effectsOn ? { scale: 0.95 } : {}}
              onClick={() => setShowPerfTester(!showPerfTester)}
              className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border ${
                showPerfTester
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview Effects
            </motion.button>
            <motion.button
              whileHover={effectsOn ? { scale: 1.05 } : {}}
              whileTap={effectsOn ? { scale: 0.95 } : {}}
              onClick={() => setAiCoachOpen(true)}
              className="px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Coach
            </motion.button>
            <motion.button
              whileHover={effectsOn ? { scale: 1.05 } : {}}
              whileTap={effectsOn ? { scale: 0.95 } : {}}
              onClick={() => setGoalsOpen(true)}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity text-black ${effectsOn ? 'glow-pulse' : ''}`}
              style={{backgroundColor:'#D6FF03'}}
            >
              <Settings className="w-3.5 h-3.5" /> Manage Goals
            </motion.button>
          </div>
        </motion.div>

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
          <h3 className="text-sm font-bold text-white mb-3">P&L Snapshot (MTD vs Last Month)</h3>
          <PLComparisonRow current={mtd} prior={priorPL} />
        </motion.div>

        {/* Stat Compare + Setter Leaderboard */}
        <motion.div
          initial={effectsOn ? { opacity: 0, y: 20 } : false}
          animate={effectsOn ? { opacity: 1, y: 0 } : false}
          transition={effectsOn ? { delay: 0.35, duration: 0.4 } : { duration: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Income vs Expenses */}
          <StatCompareCard data={statCompare} />

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

        {/* Preview Effects */}
        {showPerfTester && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Performance Goal Tester + Rank Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MMPerformanceGoal plans={[]} showTester={true} />
              <RankPreviewTester />
            </div>

            {/* Spiff Widget Tester + STL Widget Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
                <SpiffPreviewTester />
              </div>
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
                <STLPreviewTester />
              </div>
            </div>
          </motion.div>
        )}

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

      <GoalManagementModal open={goalsOpen} onOpenChange={setGoalsOpen} goals={goals} onSaved={refetchDash} />
      <AICoachInstructionsModal open={aiCoachOpen} onOpenChange={setAiCoachOpen} />
    </div>
    </PageErrorBoundary>
  );
}