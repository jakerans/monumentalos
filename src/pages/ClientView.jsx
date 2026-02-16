import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from 'utils';
import { ArrowLeft, DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';
import DateRangePicker from '../components/admin/DateRangePicker';
import MetricCard from '../components/admin/MetricCard';

export default function ClientView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');

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

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', clientId, startDate, endDate],
    queryFn: () => base44.entities.Lead.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', clientId, startDate, endDate],
    queryFn: () => base44.entities.Appointment.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  if (!user || !client) return null;

  // Filter by date range
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= new Date(startDate) && aptDate <= new Date(endDate);
  });

  const filteredLeads = leads.filter(lead => {
    const leadDate = new Date(lead.created_date);
    return leadDate >= new Date(startDate) && leadDate <= new Date(endDate);
  });

  // Calculate metrics
  const totalLeads = filteredLeads.length;
  const totalAppointments = filteredAppointments.length;
  const showedCount = filteredAppointments.filter(a => a.disposition === 'showed').length;
  const soldCount = filteredAppointments.filter(a => a.outcome === 'sold').length;
  const clientSpend = filteredLeads.reduce((sum, lead) => sum + (lead.client_spend || 0), 0);
  const clientRevenue = filteredAppointments
    .filter(a => a.outcome === 'sold')
    .reduce((sum, apt) => sum + (apt.sale_amount || 0), 0);
  const com = clientRevenue > 0 ? ((clientSpend / clientRevenue) * 100).toFixed(2) : '0.00';

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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
            <Link
              to={createPageUrl('AdminDashboard')}
              className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">
              Price per shown appointment: ${client.price_per_shown_appointment}
            </p>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard label="Client Spend" value={`$${clientSpend.toLocaleString()}`} icon={DollarSign} />
          <MetricCard label="Leads" value={totalLeads} icon={Users} />
          <MetricCard label="Appointments" value={totalAppointments} icon={Calendar} />
          <MetricCard label="Showed" value={showedCount} icon={TrendingUp} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard label="Sold" value={soldCount} highlight />
          <MetricCard label="Client Revenue" value={`$${clientRevenue.toLocaleString()}`} highlight />
          <MetricCard
            label="COM (Cost of Marketing)"
            value={`${com}%`}
            subtitle={`$${clientSpend.toLocaleString()} / $${clientRevenue.toLocaleString()}`}
            highlight
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Lead to Appointment</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalLeads > 0 ? ((totalAppointments / totalLeads) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Show Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalAppointments > 0 ? ((showedCount / totalAppointments) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Close Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {showedCount > 0 ? ((soldCount / showedCount) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalLeads > 0 ? ((soldCount / totalLeads) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}