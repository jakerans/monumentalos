import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DateRangePicker from '../components/admin/DateRangePicker';
import ReportKPICards from '../components/report/ReportKPICards';
import ReportCalculations from '../components/report/ReportCalculations';
import ReportCharts from '../components/report/ReportCharts';

export default function ClientReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

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
    if (user?.role === 'admin') return localStorage.getItem('admin_view_client_id');
    return user?.client_id;
  };

  const clientId = getClientId();

  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0] || null;
    },
    enabled: !!clientId,
  });

  // Spend by date of spend
  const { data: spendRecords = [] } = useQuery({
    queryKey: ['report-spend', clientId, startDate, endDate],
    queryFn: () => base44.entities.Spend.filter({
      client_id: clientId,
      date: { $gte: startDate, $lte: endDate }
    }),
    enabled: !!clientId,
  });

  // Appointments booked by date_appointment_set
  const { data: bookedLeads = [] } = useQuery({
    queryKey: ['report-booked', clientId, startDate, endDate],
    queryFn: () => base44.entities.Lead.filter({
      client_id: clientId,
      date_appointment_set: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate + 'T23:59:59').toISOString() }
    }),
    enabled: !!clientId,
  });

  // Appointments showed by appointment_date
  const { data: appointmentLeads = [] } = useQuery({
    queryKey: ['report-appointments', clientId, startDate, endDate],
    queryFn: () => base44.entities.Lead.filter({
      client_id: clientId,
      appointment_date: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate + 'T23:59:59').toISOString() }
    }),
    enabled: !!clientId,
  });

  // Sold by date_sold (win date)
  const { data: soldLeads = [] } = useQuery({
    queryKey: ['report-sold', clientId, startDate, endDate],
    queryFn: () => base44.entities.Lead.filter({
      client_id: clientId,
      date_sold: { $gte: startDate, $lte: endDate }
    }),
    enabled: !!clientId,
  });

  if (!user) return null;

  const totalSpend = spendRecords.reduce((sum, s) => sum + (s.amount || 0), 0);
  const appointmentsBooked = bookedLeads.length;
  // Showed = any lead with appointment_date in range whose disposition progressed to showed (including sold/lost)
  const showedAppointments = appointmentLeads.filter(l => l.disposition === 'showed' || l.disposition === 'rescheduled' || l.outcome === 'sold' || l.outcome === 'lost');
  const appointmentsShowed = showedAppointments.length;
  const cancelledCount = appointmentLeads.filter(l => l.disposition === 'cancelled').length;
  // Jobs sold & revenue based on appointment_date range (not date_sold) so sold leads count in showed too
  const soldFromShowed = showedAppointments.filter(l => l.outcome === 'sold');
  const jobsSold = soldFromShowed.length;
  const totalRevenue = soldFromShowed.reduce((sum, l) => sum + (l.sale_amount || 0), 0);

  const cancellationRate = appointmentLeads.length > 0
    ? ((cancelledCount / appointmentLeads.length) * 100).toFixed(1)
    : '0.0';
  const winRate = appointmentsShowed > 0
    ? ((jobsSold / appointmentsShowed) * 100).toFixed(1)
    : '0.0';
  const avgJobSize = jobsSold > 0
    ? (totalRevenue / jobsSold).toFixed(0)
    : '0';
  const costOfMarketing = totalRevenue > 0
    ? ((totalSpend / totalRevenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
              <div className="flex gap-4">
                <Link to={createPageUrl('ClientPortal')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  My Appointments
                </Link>
                <Link to={createPageUrl('AppointmentHistory')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  History
                </Link>
                <Link to={createPageUrl('ClientReport')} className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                  Report
                </Link>
              </div>
              {user.role === 'admin' && clientInfo && (
                <span className="text-sm text-gray-500">(Viewing as: {clientInfo.name})</span>
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
              <button onClick={() => base44.auth.logout()} className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Report</h1>
            <p className="text-gray-600 mt-1">{clientInfo?.name || 'Loading...'}</p>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        <ReportKPICards
          totalSpend={totalSpend}
          appointmentsBooked={appointmentsBooked}
          appointmentsShowed={appointmentsShowed}
          jobsSold={jobsSold}
          totalRevenue={totalRevenue}
        />

        <ReportCalculations
          cancellationRate={cancellationRate}
          winRate={winRate}
          avgJobSize={avgJobSize}
          costOfMarketing={costOfMarketing}
          totalSpend={totalSpend}
          totalRevenue={totalRevenue}
        />

        <ReportCharts
          spendRecords={spendRecords}
          bookedLeads={bookedLeads}
          appointmentLeads={appointmentLeads}
          soldLeads={soldLeads}
        />
      </main>
    </div>
  );
}