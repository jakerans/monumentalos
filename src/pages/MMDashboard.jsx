import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import MMNav from '../components/mm/MMNav';
import MMTopStats from '../components/mm/MMTopStats';
import ClientTable from '../components/mm/ClientTable';
import AIRecapPanel from '../components/mm/AIRecapPanel';
import ClientQuickView from '../components/mm/ClientQuickView';

export default function MMDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'marketing_manager' && currentUser.role !== 'admin') {
          if (currentUser.role === 'setter') navigate(createPageUrl('SetterDashboard'));
          else if (currentUser.role === 'client') navigate(createPageUrl('ClientPortal'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [] } = useQuery({
    queryKey: ['mm-clients'],
    queryFn: () => base44.entities.Client.filter({ status: 'active' }),
  });

  const { data: allLeads = [] } = useQuery({
    queryKey: ['mm-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 2000),
  });

  const { data: allSpend = [] } = useQuery({
    queryKey: ['mm-spend'],
    queryFn: () => base44.entities.Spend.list('-date', 2000),
  });

  // Fetch pending onboard tasks for this MM
  const { data: onboardTasks = [] } = useQuery({
    queryKey: ['mm-onboard-tasks-nav'],
    queryFn: () => base44.entities.OnboardTask.filter({ assigned_to: 'marketing_manager' }),
  });

  const { data: onboardProjects = [] } = useQuery({
    queryKey: ['mm-onboard-projects-nav'],
    queryFn: () => base44.entities.OnboardProject.filter({ status: 'in_progress' }),
  });

  const pendingOnboardCount = useMemo(() => {
    if (!user) return 0;
    const myProjectIds = user.role === 'admin'
      ? onboardProjects.map(p => p.id)
      : onboardProjects.filter(p => p.assigned_mm_id === user.id).map(p => p.id);
    return onboardTasks.filter(t =>
      (t.status === 'pending' || t.status === 'in_progress') &&
      myProjectIds.includes(t.project_id)
    ).length;
  }, [user, onboardTasks, onboardProjects]);

  const clientMetrics = useMemo(() => {
    const now = new Date();
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
    const d7Str = d7.toISOString();
    const d30Str = d30.toISOString();
    const d7Date = d7.toISOString().split('T')[0];
    const d30Date = d30.toISOString().split('T')[0];

    return clients.map(client => {
      const cLeads = allLeads.filter(l => l.client_id === client.id);
      const cSpend = allSpend.filter(s => s.client_id === client.id);

      // 7-day
      const leads7d = cLeads.filter(l => l.created_date >= d7Str).length;
      const spend7d = cSpend.filter(s => s.date >= d7Date).reduce((s, r) => s + (r.amount || 0), 0);
      const appts7d = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= d7Str).length;
      const cpa7d = appts7d > 0 ? spend7d / appts7d : Infinity;

      // 30-day
      const leads30d = cLeads.filter(l => l.created_date >= d30Str).length;
      const spend30d = cSpend.filter(s => s.date >= d30Date).reduce((s, r) => s + (r.amount || 0), 0);
      const appts30d = cLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= d30Str).length;
      const cpa30d = appts30d > 0 ? spend30d / appts30d : Infinity;

      // Show rate (7d) — appointments in 7d window with showed disposition
      const apptLeads7d = cLeads.filter(l => l.appointment_date && l.appointment_date >= d7Str);
      const showed7d = apptLeads7d.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost').length;
      const showRate7d = apptLeads7d.length > 0 ? `${((showed7d / apptLeads7d.length) * 100).toFixed(0)}%` : '—';

      // Avg STL
      const stlLeads = cLeads.filter(l => l.speed_to_lead_minutes != null && l.created_date >= d7Str);
      const stl = stlLeads.length > 0 ? stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length : null;

      // Alerts
      const alerts = [];
      if (cpa7d > 300 && appts7d > 0) alerts.push(`High CPA: $${cpa7d.toFixed(0)} (7d)`);
      if (spend7d > 0 && appts7d === 0) alerts.push('Spending but 0 appointments set in 7 days');
      if (stl !== null && stl > 15) alerts.push(`Slow STL: ${stl.toFixed(0)} min avg`);
      const newUncontacted = cLeads.filter(l => l.status === 'new' && l.created_date >= d7Str).length;
      if (newUncontacted >= 5) alerts.push(`${newUncontacted} new leads not yet contacted`);

      return {
        ...client,
        leads7d, spend7d, appts7d, cpa7d,
        leads30d, spend30d, appts30d, cpa30d,
        showRate7d, stl, alerts,
      };
    });
  }, [clients, allLeads, allSpend]);

  const topStats = useMemo(() => {
    const activeClients = clientMetrics.length;
    const apptsSet7d = clientMetrics.reduce((s, c) => s + c.appts7d, 0);
    const spend7d = clientMetrics.reduce((s, c) => s + c.spend7d, 0);
    const avgCPA7d = apptsSet7d > 0 ? spend7d / apptsSet7d : 0;
    const stlClients = clientMetrics.filter(c => c.stl !== null);
    const avgSTL = stlClients.length > 0 ? stlClients.reduce((s, c) => s + c.stl, 0) / stlClients.length : null;
    const alertCount = clientMetrics.filter(c => c.alerts.length > 0).length;
    return { activeClients, apptsSet7d, spend7d, avgCPA7d, avgSTL, alertCount };
  }, [clientMetrics]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MMNav user={user} clients={clients} pendingOnboardCount={pendingOnboardCount} />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 py-3 flex flex-col min-h-0">
        <MMTopStats stats={topStats} />

        <div className="flex-1 flex gap-3 min-h-0" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Main table — always visible */}
          <div className="flex-1 min-w-0">
            <ClientTable
              clientMetrics={clientMetrics}
              onSelectClient={setSelectedClient}
            />
          </div>

          {/* Right panel — AI recap or Client quick view */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            {selectedClient ? (
              <ClientQuickView
                client={selectedClient}
                onClose={() => setSelectedClient(null)}
              />
            ) : (
              <AIRecapPanel
                clientMetrics={clientMetrics}
                leads={allLeads}
                spendRecords={allSpend}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}