import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar, Phone, Mail } from 'lucide-react';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import AppointmentCard from '../components/client/AppointmentCard';

export default function AppointmentHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filterDisposition, setFilterDisposition] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'client' && currentUser.app_role !== 'admin') {
          if (currentUser.app_role === 'setter') window.location.href = '/SetterDashboard';
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

  const { data: leads = [] } = useQuery({
    queryKey: ['history-leads', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const allLeads = await base44.entities.Lead.filter({ client_id: clientId });
      return allLeads.filter(lead => 
        lead.appointment_date && 
        (lead.disposition === 'cancelled' || 
         lead.disposition === 'showed' ||
         (lead.outcome && lead.outcome !== 'pending'))
      );
    },
    enabled: !!clientId,
  });

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

  const filteredLeads = leads.filter(lead => {
    const dispositionMatch = filterDisposition === 'all' || lead.disposition === filterDisposition;
    const outcomeMatch = filterOutcome === 'all' || lead.outcome === filterOutcome;
    return dispositionMatch && outcomeMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:h-16">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Monumental<span className="text-cyan-400">OS</span></h1>
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
              <Link to={createPageUrl('ClientPortal')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">
                Appointments
              </Link>
              <Link to={createPageUrl('AppointmentHistory')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white/10 text-white whitespace-nowrap">
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
                  className="px-3 py-1.5 text-sm border border-slate-700 text-slate-300 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
        <Link
          to={createPageUrl('ClientPortal')}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </Link>

        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Disposition</label>
                <select
                  value={filterDisposition}
                  onChange={(e) => setFilterDisposition(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="showed">Showed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Outcome</label>
                <select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Completed & Cancelled</h2>
          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500">No appointments match the selected filters</div>
          ) : (
            filteredLeads.map((lead) => (
              <AppointmentCard
                key={lead.id}
                lead={lead}
                onSelect={(id) => { setSelectedLeadId(id); setDrawerOpen(true); }}
              />
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Completed & Cancelled Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disposition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No appointments match the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelectedLeadId(lead.id); setDrawerOpen(true); }}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-left"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(lead.appointment_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                          lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <LeadDetailsDrawer
          leadId={selectedLeadId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onLeadUpdated={() => {}}
        />
      </main>
    </div>
  );
}