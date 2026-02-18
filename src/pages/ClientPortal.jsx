import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, CheckCircle, Clock, AlertTriangle, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import AppointmentCard from '../components/client/AppointmentCard';
import OutstandingInvoiceAlert from '../components/client/OutstandingInvoiceAlert';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

const PAGE_SIZE = 20;

export default function ClientPortal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(0);

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    await base44.entities.Lead.update(leadId, { status: 'disqualified' });
    refetch();
    toast({ title: 'Lead Disqualified', variant: 'default' });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A]">
      <nav className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:h-16">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Monumental<span style={{color:'#D6FF03'}}>OS</span></h1>
              <div className="flex items-center gap-2 sm:hidden">
                {user.app_role === 'admin' && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('admin_view_client_id');
                      navigate(createPageUrl('AdminDashboard'));
                    }}
                    className="px-2 py-1 text-xs border border-slate-700 text-slate-300 rounded-md hover:bg-white/5"
                  >
                    Admin
                  </button>
                )}
                <button onClick={() => base44.auth.logout()} className="text-xs text-slate-400 hover:text-white">Logout</button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 pb-2 sm:pb-0 overflow-x-auto">
              <Link to={createPageUrl('ClientPortal')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white/10 text-white whitespace-nowrap">
                Appointments
              </Link>
              <Link to={createPageUrl('AppointmentHistory')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">
                History
              </Link>
              <Link to={createPageUrl('ClientReport')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">
                Report
              </Link>
              <Link to={createPageUrl('ClientSettings')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">
                Settings
              </Link>
              {user.app_role === 'admin' && clientInfo && (
                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">(Viewing: {clientInfo.name})</span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-4">
              {user.app_role === 'admin' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('admin_view_client_id');
                    navigate(createPageUrl('AdminDashboard'));
                  }}
                  className="px-3 py-1.5 text-sm border border-slate-700 text-slate-300 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                >
                  Back to Admin
                </button>
              )}
              <span className="text-sm text-slate-400">{user.full_name}</span>
              <button onClick={() => base44.auth.logout()} className="text-sm text-slate-500 hover:text-white transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Here's your appointment overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
        {clientId && <OutstandingInvoiceAlert clientId={clientId} />}

        <div className={`grid ${isRetainer ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'} gap-2 sm:gap-4 mb-6 sm:mb-8`}>
          <div className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <p className="text-[10px] sm:text-sm font-medium text-slate-400">Scheduled MTD</p>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-white">{scheduledMTD}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <p className="text-[10px] sm:text-sm font-medium text-slate-400">Upcoming</p>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-white">{upcomingCount}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
              <p className="text-[10px] sm:text-sm font-medium text-slate-400">Showed</p>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-white">{showedMTD}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-red-500/30" style={{ backgroundColor: needsOutcomeCount > 0 ? 'rgba(239,68,68,0.08)' : undefined }}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <p className="text-[10px] sm:text-sm font-medium text-red-400">Needs Outcome</p>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-red-400">{needsOutcomeCount}</p>
          </div>
          {isRetainer && (
            <div className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                <p className="text-[10px] sm:text-sm font-medium text-slate-400">Disqualified</p>
              </div>
              <p className="text-lg sm:text-3xl font-bold text-white">{dqLeads.length}</p>
            </div>
          )}
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          <h2 className="text-xl font-bold text-white">{isRetainer ? 'All Leads' : 'My Appointments'}</h2>
          {activeLeads.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-6 text-center text-slate-500">No active appointments</div>
          ) : (
            activeLeads.map((lead) => (
              <div key={lead.id} className={needsOutcomeIds.has(lead.id) ? 'ring-1 ring-red-500/50 rounded-lg' : ''}>
                <AppointmentCard
                  lead={lead}
                  onSelect={(id) => { setSelectedLeadId(id); setDrawerOpen(true); }}
                  needsOutcome={needsOutcomeIds.has(lead.id)}
                />
                {isRetainer && (
                  <button
                    onClick={() => handleDisqualify(lead.id)}
                    className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10"
                  >
                    <Ban className="w-3 h-3" /> Disqualify
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block bg-slate-800/50 rounded-lg shadow border border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">{isRetainer ? 'All Leads' : 'My Appointments'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Contact</th>
                  {isRetainer && <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Appointment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Disposition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Revenue</th>
                  {isRetainer && <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {activeLeads.length === 0 ? (
                  <tr>
                    <td colSpan={isRetainer ? 8 : 6} className="px-6 py-8 text-center text-slate-500">No active leads</td>
                  </tr>
                ) : (
                  activeLeads.map((lead) => {
                    const isNeedsOutcome = needsOutcomeIds.has(lead.id);
                    return (
                    <tr key={lead.id} className={`${isNeedsOutcome ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-slate-700/20'}`}>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelectedLeadId(lead.id); setDrawerOpen(true); }}
                          className={`font-medium hover:underline text-left ${isNeedsOutcome ? 'text-red-400 hover:text-red-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          {lead.name}
                          {isNeedsOutcome && <span className="ml-1.5 text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">NEEDS OUTCOME</span>}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </td>
                      {isRetainer && (
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lead.status === 'new' ? 'bg-blue-500/15 text-blue-400' :
                            lead.status === 'first_call_made' ? 'bg-amber-500/15 text-amber-400' :
                            lead.status === 'contacted' ? 'bg-cyan-500/15 text-cyan-400' :
                            lead.status === 'appointment_booked' ? 'bg-green-500/15 text-green-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {lead.status === 'first_call_made' ? 'First Call' : (lead.status || 'new').replace(/_/g, ' ')}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {lead.appointment_date ? new Date(lead.appointment_date).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {lead.disposition ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                            lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                            lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.disposition}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        {lead.outcome ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                            lead.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lead.outcome}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        {lead.sale_amount > 0 ? (
                          <span className="text-sm font-bold text-green-700">${lead.sale_amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      {isRetainer && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDisqualify(lead.id); }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
                          >
                            <Ban className="w-3 h-3" /> DQ
                          </button>
                        </td>
                      )}
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <LeadDetailsDrawer
          leadId={selectedLeadId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onLeadUpdated={refetch}
        />
      </main>
    </div>
    </PageErrorBoundary>
  );
}