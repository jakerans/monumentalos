import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, TrendingUp, Calendar } from 'lucide-react';
import MetricCard from '../components/admin/MetricCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role === 'marketing_manager') {
        navigate(createPageUrl('MMDashboard'));
        return;
      }
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('SetterDashboard'));
      }
    } catch (error) {
      navigate(createPageUrl('Login'));
    }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ status: 'active' }),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: allLeads = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Lead.list(),
  });
  
  const appointments = allLeads.filter(lead => lead.appointment_date);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Agency ERP</h1>
              <div className="flex gap-4">
                <Link
                  to={createPageUrl('AdminDashboard')}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                >
                  Dashboard
                </Link>
                <Link
                  to={createPageUrl('RevenueDashboard')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Revenue
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                onChange={(e) => {
                  if (e.target.value === 'setter') {
                    navigate(createPageUrl('SetterDashboard'));
                  } else if (e.target.value === 'mm') {
                    navigate(createPageUrl('MMDashboard'));
                  } else if (e.target.value === 'onboard') {
                    navigate(createPageUrl('OnboardDashboard'));
                  } else if (e.target.value.startsWith('client-')) {
                    const clientId = e.target.value.replace('client-', '');
                    localStorage.setItem('admin_view_client_id', clientId);
                    navigate(createPageUrl('ClientPortal'));
                  }
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">View as Admin</option>
                <option value="mm">View as Marketing Manager</option>
                <option value="onboard">View as Onboard Admin</option>
                <option value="setter">View as Setter</option>
                <optgroup label="View as Client">
                  {clients.map(client => (
                    <option key={client.id} value={`client-${client.id}`}>
                      {client.name}
                    </option>
                  ))}
                </optgroup>
              </select>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            label="Total Clients"
            value={clients.length}
            icon={Users}
          />
          <MetricCard
            label="Active Leads"
            value={leads.length}
            icon={TrendingUp}
          />
          <MetricCard
            label="Total Appointments"
            value={appointments.length}
            icon={Calendar}
          />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Clients</h2>
            <Link
              to={createPageUrl('ClientManagement')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Client
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {loadingClients ? (
              <div className="px-6 py-8 text-center text-gray-500">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No clients yet. Add your first client to get started.</div>
            ) : (
              clients.map((client) => (
                <Link
                  key={client.id}
                  to={createPageUrl('ClientView') + `?clientId=${client.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        ${client.price_per_shown_appointment} per shown appointment
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}