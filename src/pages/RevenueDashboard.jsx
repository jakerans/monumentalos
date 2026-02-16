import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from 'utils';
import { DollarSign, TrendingUp, Users, Edit2, Check, X } from 'lucide-react';
import DateRangePicker from '../components/admin/DateRangePicker';

export default function RevenueDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [editingClientId, setEditingClientId] = useState(null);
  const [editPrice, setEditPrice] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('SetterDashboard'));
        }
      } catch (error) {
        navigate(createPageUrl('Login'));
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ status: 'active' }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', startDate, endDate],
    queryFn: () => base44.entities.Appointment.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', startDate, endDate],
    queryFn: () => base44.entities.Lead.list(),
  });

  if (!user) return null;

  // Filter by date range
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= new Date(startDate) && aptDate <= new Date(endDate);
  });

  // Calculate metrics per client
  const clientMetrics = clients.map(client => {
    const clientAppointments = filteredAppointments.filter(a => a.client_id === client.id);
    const showedCount = clientAppointments.filter(a => a.disposition === 'showed').length;
    const agencyRevenue = showedCount * client.price_per_shown_appointment;
    const clientLeads = leads.filter(l => l.client_id === client.id);
    const clientSpend = clientLeads.reduce((sum, lead) => sum + (lead.client_spend || 0), 0);

    return {
      ...client,
      showedCount,
      agencyRevenue,
      clientSpend,
    };
  });

  const totalRevenue = clientMetrics.reduce((sum, c) => sum + c.agencyRevenue, 0);
  const totalShowed = clientMetrics.reduce((sum, c) => sum + c.showedCount, 0);

  const handleEditPrice = (clientId, currentPrice) => {
    setEditingClientId(clientId);
    setEditPrice(currentPrice);
  };

  const handleSavePrice = async (clientId) => {
    await base44.entities.Client.update(clientId, { price_per_shown_appointment: editPrice });
    setEditingClientId(null);
    refetchClients();
  };

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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  to={createPageUrl('RevenueDashboard')}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                >
                  Revenue
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
            <p className="text-gray-600 mt-1">Agency revenue by client</p>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white border border-blue-600">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6" />
              <p className="text-sm font-medium opacity-90">Total Agency Revenue</p>
            </div>
            <p className="text-4xl font-bold">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <p className="text-sm font-medium text-gray-600">Total Showed Appointments</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{totalShowed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{clients.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Client Revenue Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price per Shown Appmt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Showed Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Spend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientMetrics.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={createPageUrl('ClientView') + `?clientId=${client.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingClientId === client.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">$</span>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleSavePrice(client.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingClientId(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-900 font-medium">
                          ${client.price_per_shown_appointment}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-semibold">{client.showedCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-bold text-lg">
                        ${client.agencyRevenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">
                        ${client.clientSpend.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditPrice(client.id, client.price_per_shown_appointment)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}