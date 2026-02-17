import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DateRangePicker from '../components/admin/DateRangePicker';
import ClientViewNav from '../components/clientview/ClientViewNav';
import ClientKPIGrid from '../components/clientview/ClientKPIGrid';
import ClientFunnel from '../components/clientview/ClientFunnel';
import ClientLeadBreakdown from '../components/clientview/ClientLeadBreakdown';
import ClientSpendChart from '../components/clientview/ClientSpendChart';
import ClientSettingsCard from '../components/clientview/ClientSettingsCard';
import LeadDrilldownDialog from '../components/clientview/LeadDrilldownDialog';
import SpendDrilldownDialog from '../components/clientview/SpendDrilldownDialog';

export default function ClientView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [drilldown, setDrilldown] = useState(null); // 'leads' | 'booked' | 'showed' | 'cancelled' | 'sold' | 'spend' | null

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin' && currentUser.role !== 'marketing_manager') {
          navigate(createPageUrl('SetterDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId,
  });

  const { data: allLeads = [], refetch: refetchLeads } = useQuery({
    queryKey: ['client-all-leads', clientId],
    queryFn: () => base44.entities.Lead.filter({ client_id: clientId }, '-created_date', 2000),
    enabled: !!clientId,
  });

  const { data: allSpend = [], refetch: refetchSpend } = useQuery({
    queryKey: ['client-all-spend', clientId],
    queryFn: () => base44.entities.Spend.filter({ client_id: clientId }, '-date', 2000),
    enabled: !!clientId,
  });

  const startISO = new Date(startDate).toISOString();
  const endISO = new Date(endDate + 'T23:59:59').toISOString();

  // Filter leads by created_date within range
  const leads = useMemo(() =>
    allLeads.filter(l => l.created_date >= startISO && l.created_date <= endISO),
    [allLeads, startISO, endISO]
  );

  // Appointments booked in range (by date_appointment_set)
  const bookedLeads = useMemo(() =>
    allLeads.filter(l => l.date_appointment_set && l.date_appointment_set >= startISO && l.date_appointment_set <= endISO),
    [allLeads, startISO, endISO]
  );

  // Appointments with appointment_date in range (for show/cancel rates)
  const apptLeads = useMemo(() =>
    allLeads.filter(l => l.appointment_date && l.appointment_date >= startISO && l.appointment_date <= endISO),
    [allLeads, startISO, endISO]
  );

  // Spend in range
  const spendInRange = useMemo(() =>
    allSpend.filter(s => s.date >= startDate && s.date <= endDate),
    [allSpend, startDate, endDate]
  );

  const soldLeads = useMemo(() =>
    allLeads.filter(l => l.outcome === 'sold' && l.date_sold && l.date_sold >= startDate && l.date_sold <= endDate),
    [allLeads, startDate, endDate]
  );

  const showedLeads = useMemo(() =>
    apptLeads.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost'),
    [apptLeads]
  );

  const cancelledLeads = useMemo(() =>
    apptLeads.filter(l => l.disposition === 'cancelled'),
    [apptLeads]
  );

  const drilldownMap = {
    leads: { title: 'All Leads', data: leads },
    booked: { title: 'Appointments Booked', data: bookedLeads },
    showed: { title: 'Showed Appointments', data: showedLeads },
    cancelled: { title: 'Cancelled Appointments', data: cancelledLeads },
    sold: { title: 'Jobs Sold', data: soldLeads },
  };

  const handleCardClick = (key) => setDrilldown(key);
  const handleRefresh = () => { refetchLeads(); refetchSpend(); };

  const metrics = useMemo(() => {
    const totalSpend = spendInRange.reduce((s, r) => s + (r.amount || 0), 0);
    const totalLeads = leads.length;
    const apptsBooked = bookedLeads.length;
    const apptsShowed = apptLeads.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost').length;
    const apptsCancelled = apptLeads.filter(l => l.disposition === 'cancelled').length;
    const jobsSold = soldLeads.length;
    const totalRevenue = soldLeads.reduce((s, l) => s + (l.sale_amount || 0), 0);
    const dqCount = leads.filter(l => l.status === 'disqualified').length;

    const cpa = apptsBooked > 0 ? totalSpend / apptsBooked : Infinity;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : Infinity;
    const showRate = apptLeads.length > 0 ? ((apptsShowed / apptLeads.length) * 100).toFixed(1) : '0.0';
    const closeRate = apptsShowed > 0 ? ((jobsSold / apptsShowed) * 100).toFixed(1) : '0.0';
    const conversionRate = totalLeads > 0 ? ((jobsSold / totalLeads) * 100).toFixed(1) : '0.0';

    // Avg STL
    const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null);
    const stl = stlLeads.length > 0 ? stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length : null;

    return {
      totalSpend, totalLeads, apptsBooked, apptsShowed, apptsCancelled,
      jobsSold, totalRevenue, cpa, cpl, showRate, closeRate, stl,
      dqCount, conversionRate,
    };
  }, [leads, bookedLeads, apptLeads, spendInRange, soldLeads]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientViewNav user={user} clientName={client?.name} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-5 py-4 space-y-4">
        {/* Header + Date Picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{client?.name || 'Loading...'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {client?.billing_type === 'pay_per_set' ? `$${client?.price_per_set_appointment || 0} / appt set` :
               client?.billing_type === 'retainer' ? `$${client?.retainer_amount || 0}/mo retainer` :
               `$${client?.price_per_shown_appointment || 0} / shown appt`} · {client?.status || 'active'}
            </p>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        {/* KPI Grid */}
        <ClientKPIGrid metrics={metrics} onCardClick={handleCardClick} />

        {/* Charts + Funnel row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <ClientSpendChart spendRecords={spendInRange} leads={leads} />
          </div>
          <ClientFunnel metrics={metrics} />
        </div>

        {/* Lead breakdowns */}
        <ClientLeadBreakdown leads={leads} />

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ClientSettingsCard client={client} />
        </div>
        {/* Drilldown dialogs */}
        {drilldown && drilldown !== 'spend' && drilldownMap[drilldown] && (
          <LeadDrilldownDialog
            open={true}
            onOpenChange={(v) => { if (!v) setDrilldown(null); }}
            title={drilldownMap[drilldown].title}
            leads={drilldownMap[drilldown].data}
            onLeadUpdated={handleRefresh}
          />
        )}

        {drilldown === 'spend' && (
          <SpendDrilldownDialog
            open={true}
            onOpenChange={(v) => { if (!v) setDrilldown(null); }}
            title="Ad Spend Records"
            spendRecords={spendInRange}
            onUpdated={handleRefresh}
          />
        )}
      </main>
    </div>
  );
}