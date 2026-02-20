import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import DateRangePicker from '../components/admin/DateRangePicker';
import ClientViewNav from '../components/clientview/ClientViewNav';
import ClientKPIGrid from '../components/clientview/ClientKPIGrid';
import ClientFunnel from '../components/clientview/ClientFunnel';
import ClientLeadBreakdown from '../components/clientview/ClientLeadBreakdown';
import ClientSpendChart from '../components/clientview/ClientSpendChart';
import ClientSettingsCard from '../components/clientview/ClientSettingsCard';
import ClientBillingEditor from '../components/clientview/ClientBillingEditor';
import ClientInvoiceHistory from '../components/clientview/ClientInvoiceHistory';
import LeadDrilldownDialog from '../components/clientview/LeadDrilldownDialog';
import SpendDrilldownDialog from '../components/clientview/SpendDrilldownDialog';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

export default function ClientView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [drilldown, setDrilldown] = useState(null);
  const [billingEditorOpen, setBillingEditorOpen] = useState(false);

  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin' && currentUser.app_role !== 'marketing_manager') {
          navigate(createPageUrl('SetterDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: viewData, refetch: refetchViewData, isLoading: viewLoading } = useQuery({
    queryKey: ['client-view-data', clientId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getClientViewData', { client_id: clientId });
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const client = viewData?.client || null;
  const allLeads = viewData?.leads || [];
  const allSpend = viewData?.spend || [];
  const refetchLeads = refetchViewData;
  const refetchSpend = refetchViewData;

  const startISO = dayjs(startDate).startOf('day').toISOString();
  const endISO = dayjs(endDate).endOf('day').toISOString();

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
  const refetchClient = () => queryClient.invalidateQueries({ queryKey: ['client', clientId] });
  const canEditBilling = user?.app_role === 'admin' || user?.app_role === 'onboard_admin';

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
  if (viewLoading) return <PageLoader message="Loading client data..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
      <ClientViewNav user={user} clientName={client?.name} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-5 py-4 space-y-4">
        {/* Header + Date Picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{client?.name || 'Loading...'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {client?.billing_type === 'retainer'
                ? `$${client?.retainer_amount || 0}/mo retainer`
                : (client?.industry_pricing && client.industry_pricing.length > 0)
                  ? client.industry_pricing.map(p => `${p.industry}: $${client?.billing_type === 'pay_per_set' ? (p.price_per_set || 0) : (p.price_per_show || 0)}`).join(' · ')
                  : client?.billing_type === 'pay_per_set'
                    ? `$${client?.price_per_set_appointment || 0} / appt set`
                    : `$${client?.price_per_shown_appointment || 0} / shown appt`
              } · {client?.status || 'active'}
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

        {/* Invoice History + Settings */}
        <ClientInvoiceHistory clientId={clientId} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ClientSettingsCard client={client} userRole={user?.app_role} onUpdated={refetchClient} />
          {canEditBilling && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-2">Billing Management</h3>
              <p className="text-xs text-slate-400 mb-3">
                {client?.billing_type === 'retainer'
                  ? `Retainer: $${client?.retainer_amount || 0}/mo · Due on the ${client?.retainer_due_day || 1}${client?.retainer_due_day === 1 ? 'st' : client?.retainer_due_day === 2 ? 'nd' : client?.retainer_due_day === 3 ? 'rd' : 'th'}`
                  : (client?.industry_pricing && client.industry_pricing.length > 0)
                    ? client.industry_pricing.map(p => `${p.industry}: $${client?.billing_type === 'pay_per_set' ? (p.price_per_set || 0) : (p.price_per_show || 0)}`).join(' · ')
                    : client?.billing_type === 'pay_per_set'
                    ? `Pay Per Set: $${client?.price_per_set_appointment || 0}/appt`
                    : `Pay Per Show: $${client?.price_per_shown_appointment || 0}/show`}
              </p>
              <button
                onClick={() => setBillingEditorOpen(true)}
                className="mt-auto px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View / Edit Billing
              </button>
            </div>
          )}
        </div>

        {canEditBilling && (
          <ClientBillingEditor
            client={client}
            open={billingEditorOpen}
            onOpenChange={setBillingEditorOpen}
            onUpdated={refetchClient}
          />
        )}
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
    </PageErrorBoundary>
  );
}