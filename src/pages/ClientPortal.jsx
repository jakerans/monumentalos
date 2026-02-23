import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from '@/components/ui/use-toast';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import QuickOutcomeModal from '../components/client/QuickOutcomeModal';
import OutstandingInvoiceAlert from '../components/client/OutstandingInvoiceAlert';
import RetainerPortalView from '../components/client/RetainerPortalView';
import PerformancePortalView from '../components/client/PerformancePortalView';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import ClientSidebar from '../components/client/ClientSidebar';

const PAGE_SIZE = 20;

export default function ClientPortal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(0);

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickOutcomeLead, setQuickOutcomeLead] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const appRole = currentUser.app_role;
        if (!appRole) {
          navigate(createPageUrl('AccountPending'));
          return;
        }
        
        if (appRole !== 'client' && appRole !== 'admin') {
          if (appRole === 'setter') navigate(createPageUrl('SetterDashboard'));
          else if (appRole === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else if (appRole === 'onboard_admin') navigate(createPageUrl('OnboardDashboard'));
          else navigate(createPageUrl('AdminDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  const getClientId = () => {
    if (user?.app_role === 'admin') {
      return localStorage.getItem('admin_view_client_id');
    }
    return user?.client_id;
  };

  const clientId = getClientId();

  // Single backend call for KPIs + paginated leads
  const { data: portalData, isLoading: portalLoading, refetch } = useQuery({
    queryKey: ['client-portal-data', clientId, page],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await base44.functions.invoke('getClientPortalData', {
        client_id: clientId,
        page,
        page_size: PAGE_SIZE,
        section: 'active',
      });
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });

  const clientInfo = portalData?.clientInfo || null;
  const isRetainer = portalData?.isRetainer || false;
  const kpis = portalData?.kpis || { scheduledMTD: 0, upcomingCount: 0, showedMTD: 0, needsOutcomeCount: 0, disqualifiedCount: 0 };
  const activeLeads = portalData?.leads || [];
  const pagination = portalData?.pagination || { page: 0, total_pages: 0, total_count: 0, has_more: false };

  const handleDisqualify = async (leadId) => {
    const lead = activeLeads.find(l => l.id === leadId);
    if (!lead || lead.client_id !== clientId) return;
    await base44.entities.Lead.update(leadId, { status: 'disqualified' });
    refetch();
    toast({ title: 'Lead Disqualified', variant: 'default' });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) return null;
  if (!portalData && portalLoading) return <PageLoader message="Loading appointments..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <ClientSidebar user={user} currentPage="ClientPortal" isRetainer={isRetainer} />

      {/* Mobile top bar spacer */}
      <div className="md:hidden h-14 shrink-0" />

      <main className="flex-1 min-w-0 pt-14 md:pt-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {user.app_role === 'admin' && clientInfo && (
          <div className="mb-4 flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2">
            <span className="text-xs text-slate-400">Viewing as client: <span className="text-white font-medium">{clientInfo.name}</span></span>
            <button
              onClick={() => { localStorage.removeItem('admin_view_client_id'); navigate(createPageUrl('AdminDashboard')); }}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-1"
            >
              Back to Admin
            </button>
          </div>
        )}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Here's your {isRetainer ? 'lead' : 'appointment'} overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
        {clientId && <OutstandingInvoiceAlert clientId={clientId} />}

        {isRetainer ? (
          <RetainerPortalView
            kpis={kpis}
            leads={activeLeads}
            pagination={pagination}
            page={page}
            onPageChange={handlePageChange}
            onSelectLead={(id) => { setSelectedLeadId(id); setDrawerOpen(true); }}
            onDisqualify={handleDisqualify}
          />
        ) : (
          <PerformancePortalView
            kpis={kpis}
            leads={activeLeads}
            pagination={pagination}
            page={page}
            onPageChange={handlePageChange}
            onSelectLead={(id) => { setSelectedLeadId(id); setDrawerOpen(true); }}
            onQuickOutcome={setQuickOutcomeLead}
          />
        )}

        <LeadDetailsDrawer
          leadId={selectedLeadId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onLeadUpdated={refetch}
        />

        <QuickOutcomeModal
          open={!!quickOutcomeLead}
          onOpenChange={(v) => { if (!v) setQuickOutcomeLead(null); }}
          lead={quickOutcomeLead}
          onUpdated={() => { refetch(); setQuickOutcomeLead(null); }}
        />
      </main>
    </div>
    </PageErrorBoundary>
  );

}