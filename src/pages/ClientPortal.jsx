import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import AppointmentCard from '../components/client/AppointmentCard';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

  const { data: allClientLeads = [], refetch } = useQuery({
    queryKey: ['client-leads', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.Lead.filter({ client_id: clientId });
    },
    enabled: !!clientId,
  });

  const leads = allClientLeads.filter(lead => lead.appointment_date);

  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0] || null;
    },
    enabled: !!clientId,
  });

  if (!user) return null;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  // Scheduled MTD: appointments booked (date_appointment_set) this month
  const scheduledMTD = leads.filter(l => inRange(l.date_appointment_set, thisMonthStart, now)).length;

  // Upcoming: appointment date is in the future, still scheduled/rescheduled, no final outcome
  const upcomingLeads = leads.filter(l =>
    l.appointment_date && new Date(l.appointment_date) > now &&
    (lead => !lead.disposition || lead.disposition === 'scheduled' || lead.disposition === 'rescheduled')(l)
  );
  const upcomingCount = upcomingLeads.length;

  // Showed MTD: showed or sold/lost this month
  const showedMTD = leads.filter(l =>
    inRange(l.appointment_date, thisMonthStart, now) &&
    (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost')
  ).length;

  // Needs Outcome: appointment date has passed but no outcome assigned (or pending)
  const needsOutcomeLeads = leads.filter(l =>
    l.appointment_date && new Date(l.appointment_date) <= now &&
    (!l.outcome || l.outcome === 'pending') &&
    l.disposition !== 'cancelled'
  );
  const needsOutcomeCount = needsOutcomeLeads.length;
  const needsOutcomeIds = new Set(needsOutcomeLeads.map(l => l.id));

  // Active leads = upcoming + needs outcome, sorted so needs outcome is first
  const activeLeads = leads.filter(lead => {
    const isUpcoming = lead.appointment_date && new Date(lead.appointment_date) > now &&
      (!lead.disposition || lead.disposition === 'scheduled' || lead.disposition === 'rescheduled');
    const isNeedsOutcome = needsOutcomeIds.has(lead.id);
    return isUpcoming || isNeedsOutcome;
  }).sort((a, b) => {
    const aNO = needsOutcomeIds.has(a.id) ? 0 : 1;
    const bNO = needsOutcomeIds.has(b.id) ? 0 : 1;
    if (aNO !== bNO) return aNO - bNO;
    return new Date(a.appointment_date) - new Date(b.appointment_date);
  });

  return (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
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
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          <h2 className="text-xl font-bold text-white">My Appointments</h2>
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
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block bg-slate-800/50 rounded-lg shadow border border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">My Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Appointment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Disposition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {activeLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No active appointments</td>
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
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(lead.appointment_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                          lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                          lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.disposition || 'scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                          lead.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lead.outcome || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lead.sale_amount > 0 ? (
                          <span className="text-sm font-bold text-green-700">${lead.sale_amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
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
  );
}