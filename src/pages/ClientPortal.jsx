import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, CheckCircle, DollarSign } from 'lucide-react';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import AppointmentCard from '../components/client/AppointmentCard';
import StatCard from '../components/client/StatCard';

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

  const activeLeads = leads.filter(lead =>
    (lead.disposition === 'scheduled' || lead.disposition === 'rescheduled') &&
    (!lead.outcome || lead.outcome === 'pending')
  );

  // Month boundaries
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const inRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  const inDateRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    return d >= start && d <= end;
  };

  // Booked uses date_appointment_set
  const thisMonthBooked = leads.filter(l => inRange(l.date_appointment_set, thisMonthStart, now));
  const lastMonthBooked = leads.filter(l => inRange(l.date_appointment_set, lastMonthStart, lastMonthEnd));

  // Showed uses appointment_date in range + disposition showed or outcome sold/lost
  const thisMonthAppts = leads.filter(l => inRange(l.appointment_date, thisMonthStart, thisMonthEnd));
  const lastMonthAppts = leads.filter(l => inRange(l.appointment_date, lastMonthStart, lastMonthEnd));
  const thisMonthShowed = thisMonthAppts.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost');
  const lastMonthShowed = lastMonthAppts.filter(l => l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost');

  // Sold/revenue use date_sold
  const thisMonthSold = leads.filter(l => l.outcome === 'sold' && inDateRange(l.date_sold, thisMonthStart, now));
  const lastMonthSold = leads.filter(l => l.outcome === 'sold' && inDateRange(l.date_sold, lastMonthStart, lastMonthEnd));

  const stats = {
    scheduledThis: thisMonthBooked.length,
    scheduledLast: lastMonthBooked.length,
    showedThis: thisMonthShowed.length,
    showedLast: lastMonthShowed.length,
    soldThis: thisMonthSold.length,
    soldLast: lastMonthSold.length,
    revenueThis: thisMonthSold.reduce((s, l) => s + (l.sale_amount || 0), 0),
    revenueLast: lastMonthSold.reduce((s, l) => s + (l.sale_amount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:h-16">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">MonumentalOS</h1>
              <div className="flex items-center gap-2 sm:hidden">
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('admin_view_client_id');
                      navigate(createPageUrl('AdminDashboard'));
                    }}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Admin
                  </button>
                )}
                <button onClick={() => base44.auth.logout()} className="text-xs text-gray-600 hover:text-gray-900">Logout</button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 pb-2 sm:pb-0 overflow-x-auto">
              <Link to={createPageUrl('ClientPortal')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                Appointments
              </Link>
              <Link to={createPageUrl('AppointmentHistory')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">
                History
              </Link>
              <Link to={createPageUrl('ClientReport')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">
                Report
              </Link>
              <Link to={createPageUrl('ClientSettings')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">
                Settings
              </Link>
              {user.role === 'admin' && clientInfo && (
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">(Viewing: {clientInfo.name})</span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-4">
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
              <button onClick={() => base44.auth.logout()} className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatCard icon={Calendar} iconColor="text-blue-600" label="Scheduled" thisMonth={stats.scheduledThis} lastMonth={stats.scheduledLast} />
          <StatCard icon={CheckCircle} iconColor="text-green-600" label="Showed" thisMonth={stats.showedThis} lastMonth={stats.showedLast} />
          <StatCard icon={CheckCircle} iconColor="text-green-600" label="Sold" thisMonth={stats.soldThis} lastMonth={stats.soldLast} />
          <StatCard icon={DollarSign} iconColor="text-emerald-600" label="Revenue" thisMonth={stats.revenueThis} lastMonth={stats.revenueLast} format="currency" />
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