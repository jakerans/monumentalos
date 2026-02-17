import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, CheckCircle, DollarSign } from 'lucide-react';
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
        if (currentUser.role !== 'client' && currentUser.role !== 'admin') {
          if (currentUser.role === 'setter') window.location.href = '/SetterDashboard';
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  const getClientId = () => {
    if (user?.role === 'admin') {
      return localStorage.getItem('admin_view_client_id');
    }
    return user?.client_id;
  };

  const clientId = getClientId();

  const { data: leads = [], refetch } = useQuery({
    queryKey: ['client-leads', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const allLeads = await base44.entities.Lead.filter({ client_id: clientId });
      return allLeads.filter(lead => lead.appointment_date);
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

  const activeLeads = leads.filter(lead =>
    (lead.disposition === 'scheduled' || lead.disposition === 'rescheduled') &&
    (!lead.outcome || lead.outcome === 'pending')
  );
  const scheduledLeads = leads.filter(l => l.disposition === 'scheduled');
  const showedLeads = leads.filter(l => l.disposition === 'showed');
  const soldLeads = leads.filter(l => l.outcome === 'sold');
  const totalSoldAmount = soldLeads.reduce((sum, lead) => sum + (lead.sale_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
              <div className="flex gap-4">
                <Link
                  to={createPageUrl('ClientPortal')}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                >
                  My Appointments
                </Link>
                <Link
                  to={createPageUrl('AppointmentHistory')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  History
                </Link>
                <Link
                  to={createPageUrl('ClientReport')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Report
                </Link>
              </div>
              {user.role === 'admin' && clientInfo && (
                <span className="text-sm text-gray-500">
                  (Viewing as: {clientInfo.name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('admin_view_client_id');
                    navigate(createPageUrl('AdminDashboard'));
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back to Admin
                </button>
              )}
              <span className="text-sm text-gray-600">{user.full_name}</span>
              <button
                onClick={() => base44.auth.logout()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <p className="text-xs md:text-sm font-medium text-gray-600">Scheduled</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{scheduledLeads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs md:text-sm font-medium text-gray-600">Showed</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{showedLeads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs md:text-sm font-medium text-gray-600">Sold</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{soldLeads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-xs md:text-sm font-medium text-gray-600">Revenue</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-emerald-700">${totalSoldAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
          {activeLeads.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500">No active appointments</div>
          ) : (
            activeLeads.map((lead) => (
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
            <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
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
                {activeLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No active appointments</td>
                  </tr>
                ) : (
                  activeLeads.map((lead) => (
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
          onLeadUpdated={refetch}
        />
      </main>
    </div>
  );
}