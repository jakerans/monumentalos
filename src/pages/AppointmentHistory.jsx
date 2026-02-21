import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar, Phone, Mail } from 'lucide-react';
import ClientSidebar from '../components/client/ClientSidebar';
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

  const { data: historyData } = useQuery({
    queryKey: ['appointment-history-data', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await base44.functions.invoke('getAppointmentHistoryData', { client_id: clientId });
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const leads = historyData?.leads || [];
  const clientInfo = historyData?.clientInfo || null;

  if (!user) return null;

  const filteredLeads = leads.filter(lead => {
    const dispositionMatch = filterDisposition === 'all' || lead.disposition === filterDisposition;
    const outcomeMatch = filterOutcome === 'all' || lead.outcome === filterOutcome;
    return dispositionMatch && outcomeMatch;
  });

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <ClientSidebar user={user} currentPage="AppointmentHistory" />

      <main className="flex-1 min-w-0 pt-14 md:pt-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 mb-6">
          <div className="px-4 sm:px-6 py-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Filters</h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Disposition</label>
                <select
                  value={filterDisposition}
                  onChange={(e) => setFilterDisposition(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white"
                >
                  <option value="all">All</option>
                  <option value="showed">Showed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Outcome</label>
                <select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white"
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
          <h2 className="text-xl font-bold text-white">Completed & Cancelled</h2>
          {filteredLeads.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-6 text-center text-slate-500">No appointments match the selected filters</div>
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
        <div className="hidden md:block bg-slate-800/50 rounded-lg shadow border border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Completed & Cancelled Appointments</h2>
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
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No appointments match the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-700/20">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelectedLeadId(lead.id); setDrawerOpen(true); }}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-left"
                        >
                          {lead.name}
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
                          <span className="text-sm font-bold text-green-400">${lead.sale_amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
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