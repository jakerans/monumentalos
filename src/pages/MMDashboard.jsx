import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';

import MMNav from '../components/mm/MMNav';
import MMTopStats from '../components/mm/MMTopStats';
import ClientTable from '../components/mm/ClientTable';
import MMTaskBoard from '../components/mm/MMTaskBoard';
import ClientQuickView from '../components/mm/ClientQuickView';
import ClientBreakdownChart from '../components/mm/ClientBreakdownChart';
import MMPerformanceGoal from '../components/mm/MMPerformanceGoal';
import DateRangePicker from '../components/admin/DateRangePicker';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { motion } from 'framer-motion';

export default function MMDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dateStart, setDateStart] = useState(dayjs().subtract(29, 'day').format('YYYY-MM-DD'));
  const [dateEnd, setDateEnd] = useState(dayjs().format('YYYY-MM-DD'));
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole !== 'marketing_manager' && appRole !== 'admin') {
          if (appRole === 'setter') navigate(createPageUrl('SetterDashboard'));
          else if (appRole === 'client') navigate(createPageUrl('ClientPortal'));
          else navigate(createPageUrl('AdminDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  // Single backend call for all dashboard data
  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['mm-dashboard-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMMDashboardData');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const clients = dashData?.clients || [];
  const allLeads = dashData?.allLeads || [];
  const allSpend = dashData?.allSpend || [];
  const pendingOnboardCount = dashData?.pendingOnboardCount || 0;
  const livePerfPlans = dashData?.livePerfPlans || [];
  const refetchClients = refetchDash;

  // Resolve period start/end from the DateRangePicker
  const periodRange = useMemo(() => {
    const s = dayjs(dateStart).startOf('day');
    const e = dayjs(dateEnd).endOf('day');
    const rangeDays = e.diff(s, 'day') + 1;
    const priorEnd = s.subtract(1, 'millisecond');
    const priorStart = s.subtract(rangeDays, 'day');
    const label = `${rangeDays}d`;
    return { periodStart: s.toDate(), periodEnd: e.toDate(), priorStart: priorStart.toDate(), priorEnd: priorEnd.toDate(), label };
  }, [dateStart, dateEnd]);

  const clientMetrics = useMemo(() => {
    const now = new Date();
    const { periodStart, periodEnd, priorStart, priorEnd } = periodRange;
    const pStartStr = periodStart.toISOString();
    const pStartDate = periodStart.toISOString().split('T')[0];
    const pEndStr = periodEnd.toISOString();
    const pEndDate = periodEnd.toISOString().split('T')[0];
    const priorStartStr = priorStart.toISOString();
    const priorStartDate = priorStart.toISOString().split('T')[0];
    const priorEndStr = priorEnd.toISOString();
    const priorEndDate = priorEnd.toISOString().split('T')[0];

    // Fixed date cutoffs for 7d and 30d (used by ClientQuickView)
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
    const d7Str = d7.toISOString();
    const d7Date = d7.toISOString().split('T')[0];
    const d30Str = d30.toISOString();
    const d30Date = d30.toISOString().split('T')[0];

    return clients.map(client => {
      const cLeads = allLeads.filter(l => l.client_id === client.id);
      const cSpend = allSpend.filter(s => s.client_id === client.id);

      // Current period
      const leadsCur = cLeads.filter(l => l.created_date >= pStartStr).length;
      const spendCur = cSpend.filter(s => s.date >= pStartDate).reduce((s, r) => s + (r.amount || 0), 0);
      const apptsCur = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= pStartStr).length;
      const cpaCur = apptsCur > 0 ? spendCur / apptsCur : Infinity;

      // Prior period
      const spendPrior = cSpend.filter(s => s.date >= priorStartDate && s.date < pStartDate).reduce((s, r) => s + (r.amount || 0), 0);
      const apptsPrior = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= priorStartStr && l.date_appointment_set < pStartStr).length;
      const cpaPrior = apptsPrior > 0 ? spendPrior / apptsPrior : Infinity;

      // Show rate (current period)
      const apptLeadsCur = cLeads.filter(l => l.appointment_date && l.appointment_date >= pStartStr);
      const showedCur = apptLeadsCur.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost').length;
      const showRateCur = apptLeadsCur.length > 0 ? `${((showedCur / apptLeadsCur.length) * 100).toFixed(0)}%` : '—';

      // 7-day stats
      const spend7d = cSpend.filter(s => s.date >= d7Date).reduce((s, r) => s + (r.amount || 0), 0);
      const leads7d = cLeads.filter(l => l.created_date >= d7Str).length;
      const appts7d = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= d7Str).length;
      const cpa7d = appts7d > 0 ? spend7d / appts7d : Infinity;
      const apptLeads7d = cLeads.filter(l => l.appointment_date && l.appointment_date >= d7Str);
      const showed7d = apptLeads7d.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost').length;
      const showRate7d = apptLeads7d.length > 0 ? `${((showed7d / apptLeads7d.length) * 100).toFixed(0)}%` : '—';

      // 30-day stats
      const spend30d = cSpend.filter(s => s.date >= d30Date).reduce((s, r) => s + (r.amount || 0), 0);
      const leads30d = cLeads.filter(l => l.created_date >= d30Str).length;
      const appts30d = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= d30Str).length;
      const cpa30d = appts30d > 0 ? spend30d / appts30d : Infinity;

      // Avg STL
      const stlLeads = cLeads.filter(l => l.speed_to_lead_minutes != null && l.created_date >= pStartStr);
      const stl = stlLeads.length > 0 ? stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length : null;

      // Alerts (still use current period)
      const alerts = [];
      if (cpaCur > 300 && apptsCur > 0) alerts.push(`High CPA: $${cpaCur.toFixed(0)}`);
      if (spendCur > 0 && apptsCur === 0) alerts.push(`Spending but 0 appts (${periodRange.label})`);
      if (stl !== null && stl > 15) alerts.push(`Slow STL: ${stl.toFixed(0)} min avg`);
      const newUncontacted = cLeads.filter(l => l.status === 'new' && l.created_date >= pStartStr).length;
      if (newUncontacted >= 5) alerts.push(`${newUncontacted} new leads not yet contacted`);

      // CPA % change
      let cpaChange = null;
      if (cpaCur !== Infinity && cpaPrior !== Infinity && cpaPrior > 0) {
        cpaChange = ((cpaCur - cpaPrior) / cpaPrior) * 100;
      }

      // Monthly goal calculation
      const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mtdStr = mtdStart.toISOString();
      const mtdDate = mtdStart.toISOString().split('T')[0];
      let goalActual = null;
      if (client.goal_type === 'leads') {
        goalActual = cLeads.filter(l => l.created_date >= mtdStr).length;
      } else if (client.goal_type === 'sets') {
        goalActual = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= mtdStr).length;
      } else if (client.goal_type === 'shows') {
        goalActual = cLeads.filter(l => l.appointment_date && l.appointment_date >= mtdStr && (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost')).length;
      }

      let effectiveGoalStatus = client.goal_status || null;
      if (client.goal_type && client.goal_value && goalActual !== null && goalActual >= client.goal_value) {
        effectiveGoalStatus = 'goal_met';
      }

      // Sort helper for goal status
      const goalStatusOrder = { behind_wont_meet: 0, behind_confident: 1, on_track: 2, goal_met: 3 };
      const goalStatusSort = effectiveGoalStatus ? goalStatusOrder[effectiveGoalStatus] ?? -1 : -1;

      // Goal progress for sorting
      const goalProgress = client.goal_value ? (goalActual ?? 0) / client.goal_value : -1;

      return {
        ...client,
        leadsCur, spendCur, apptsCur, cpaCur, cpaPrior, cpaChange,
        showRateCur, stl, alerts,
        spend7d, leads7d, appts7d, cpa7d, showRate7d,
        spend30d, leads30d, appts30d, cpa30d,
        goalActual, effectiveGoalStatus, goalStatusSort, goalProgress,
      };
    });
  }, [clients, allLeads, allSpend, periodRange]);

  const topStats = useMemo(() => {
    const activeClients = clientMetrics.length;
    const apptsSet = clientMetrics.reduce((s, c) => s + c.apptsCur, 0);
    const spend = clientMetrics.reduce((s, c) => s + c.spendCur, 0);
    const avgCPA = apptsSet > 0 ? spend / apptsSet : 0;

    const { periodStart, priorStart, priorEnd } = periodRange;
    const pStartStr = periodStart.toISOString();
    const pStartDate = periodStart.toISOString().split('T')[0];
    const priorStartStr = priorStart.toISOString();
    const priorStartDate = priorStart.toISOString().split('T')[0];

    const priorSpend = allSpend.filter(s => s.date >= priorStartDate && s.date < pStartDate).reduce((s, r) => s + (r.amount || 0), 0);
    const priorAppts = allLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= priorStartStr && l.date_appointment_set < pStartStr).length;
    const priorCPA = priorAppts > 0 ? priorSpend / priorAppts : 0;
    let cpaChange = null;
    if (avgCPA > 0 && priorCPA > 0) {
      cpaChange = ((avgCPA - priorCPA) / priorCPA) * 100;
    }

    const stlClients = clientMetrics.filter(c => c.stl !== null);
    const avgSTL = stlClients.length > 0 ? stlClients.reduce((s, c) => s + c.stl, 0) / stlClients.length : null;
    const alertCount = clientMetrics.filter(c => c.alerts.length > 0).length;
    return { activeClients, apptsSet, spend, avgCPA, cpaChange, avgSTL, alertCount, periodLabel: periodRange.label };
  }, [clientMetrics, periodRange, allLeads, allSpend]);

  if (!user) return null;
  if (dashLoading) return <PageLoader message="Loading dashboard..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
      <MMNav user={user} clients={clients} pendingOnboardCount={pendingOnboardCount} />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 py-3 flex flex-col min-h-0">
        {/* Date range picker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-3"
        >
          <DateRangePicker
            startDate={dateStart}
            endDate={dateEnd}
            onStartChange={setDateStart}
            onEndChange={setDateEnd}
          />
        </motion.div>
        <MMTopStats stats={topStats} allLeads={allLeads} allSpend={allSpend} periodRange={periodRange} />

        {/* Chart toggle + chart */}
        <div className="flex items-center mb-3">
          <button
            onClick={() => setShowChart(!showChart)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              showChart ? 'bg-[#D6FF03]/10 border-[#D6FF03]/30 text-[#D6FF03]' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {showChart ? 'Hide Chart' : 'Show Lead Breakdown'}
          </button>
        </div>
        {showChart && (
          <div className="mb-3">
            <ClientBreakdownChart
              clients={clients}
              leads={allLeads}
              periodStart={periodRange.periodStart.toISOString()}
              periodEnd={periodRange.periodEnd.toISOString()}
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex-1 flex gap-3 min-h-0"
          style={{ height: 'auto', minHeight: 'min(calc(100vh - 180px), 500px)' }}
        >
          {/* Main table — always visible */}
          <div className="flex-1 min-w-0">
            <ClientTable
              clientMetrics={clientMetrics}
              onSelectClient={setSelectedClient}
            />
          </div>

          {/* Right panel — AI recap or Client quick view */}
          <div className="hidden lg:flex lg:flex-col w-80 flex-shrink-0 gap-3 overflow-y-auto">
            {selectedClient ? (
              <ClientQuickView
                client={selectedClient}
                onClose={() => setSelectedClient(null)}
                onClientUpdated={refetchClients}
              />
            ) : (
              <>
                <MMPerformanceGoal plans={livePerfPlans} />
                <MMTaskBoard clients={clients} />
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
    </PageErrorBoundary>
  );
}