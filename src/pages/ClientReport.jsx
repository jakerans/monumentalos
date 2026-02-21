import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import DateRangePicker from '../components/admin/DateRangePicker';
import ReportKPICards from '../components/report/ReportKPICards';
import ReportCalculations from '../components/report/ReportCalculations';
import ReportCharts from '../components/report/ReportCharts';
import ClientSidebar from '../components/client/ClientSidebar';

export default function ClientReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

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
    if (user?.app_role === 'admin') return localStorage.getItem('admin_view_client_id');
    return user?.client_id;
  };

  const clientId = getClientId();

  const { data: reportData } = useQuery({
    queryKey: ['client-report-data', clientId, startDate, endDate],
    queryFn: async () => {
      const res = await base44.functions.invoke('getClientReportData', {
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
      });
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const clientInfo = reportData?.clientInfo || null;
  const spendRecords = reportData?.spendRecords || [];
  const bookedLeads = reportData?.bookedLeads || [];
  const appointmentLeads = reportData?.appointmentLeads || [];
  const soldLeads = reportData?.soldLeads || [];

  if (!user) return null;

  const totalSpend = spendRecords.reduce((sum, s) => sum + (s.amount || 0), 0);
  const appointmentsBooked = bookedLeads.length;
  // Showed = any lead with appointment_date in range whose disposition progressed to showed (including sold/lost)
  const showedAppointments = appointmentLeads.filter(l => l.disposition === 'showed' || l.disposition === 'rescheduled' || l.outcome === 'sold' || l.outcome === 'lost');
  const appointmentsShowed = showedAppointments.length;
  const cancelledCount = appointmentLeads.filter(l => l.disposition === 'cancelled').length;
  // Jobs sold & revenue based on date_sold range
  const actualSoldLeads = soldLeads.filter(l => l.outcome === 'sold');
  const jobsSold = actualSoldLeads.length;
  const totalRevenue = actualSoldLeads.reduce((sum, l) => sum + (l.sale_amount || 0), 0);

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
              <Link to={createPageUrl('ClientPortal')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">
                Appointments
              </Link>
              <Link to={createPageUrl('AppointmentHistory')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">
                History
              </Link>
              <Link to={createPageUrl('ClientReport')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white/10 text-white whitespace-nowrap">
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
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Performance Report</h1>
            <p className="text-sm sm:text-base text-slate-400 mt-0.5 sm:mt-1">{clientInfo?.name || 'Loading...'}</p>
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