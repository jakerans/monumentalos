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
import ReportFunnel from '../components/report/ReportFunnel';
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
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole !== 'client' && appRole !== 'admin') {
          if (appRole === 'setter') navigate(createPageUrl('SetterDashboard'));
          else if (appRole === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else if (appRole === 'onboard_admin') navigate(createPageUrl('OnboardDashboard'));
          else if (appRole === 'finance_admin') navigate(createPageUrl('FinanceAdminDashboard'));
          else navigate(createPageUrl('AccountPending'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

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
  const priorSpendRecords = reportData?.priorSpendRecords || [];
  const priorBookedLeads = reportData?.priorBookedLeads || [];
  const priorAppointmentLeads = reportData?.priorAppointmentLeads || [];
  const priorSoldLeads = reportData?.priorSoldLeads || [];

  if (!user) return null;

  // Helper to compute metrics from a set of data
  const calcMetrics = (spend, booked, appts, sold) => {
    const totalSpend = spend.reduce((s, r) => s + (r.amount || 0), 0);
    const appointmentsBooked = booked.length;
    const showed = appts.filter(l => l.disposition === 'showed' || l.disposition === 'rescheduled' || l.outcome === 'sold' || l.outcome === 'lost');
    const appointmentsShowed = showed.length;
    const cancelledCount = appts.filter(l => l.disposition === 'cancelled').length;
    const actualSold = sold.filter(l => l.outcome === 'sold');
    const jobsSold = actualSold.length;
    const totalRevenue = actualSold.reduce((s, l) => s + (l.sale_amount || 0), 0);
    const showRate = appointmentsBooked > 0 ? ((appointmentsShowed / appointmentsBooked) * 100).toFixed(1) : '0.0';
    const costPerAppointment = appointmentsBooked > 0 ? totalSpend / appointmentsBooked : 0;
    const roi = totalSpend > 0 ? `${(totalRevenue / totalSpend).toFixed(1)}x` : '0.0x';
    const cancellationRate = appts.length > 0 ? ((cancelledCount / appts.length) * 100).toFixed(1) : '0.0';
    const winRate = appointmentsShowed > 0 ? ((jobsSold / appointmentsShowed) * 100).toFixed(1) : '0.0';
    const avgJobSize = jobsSold > 0 ? (totalRevenue / jobsSold).toFixed(0) : '0';
    const costOfMarketing = totalRevenue > 0 ? ((totalSpend / totalRevenue) * 100).toFixed(1) : '0.0';
    return { totalSpend, appointmentsBooked, appointmentsShowed, jobsSold, totalRevenue, showRate, costPerAppointment, roi, cancellationRate, winRate, avgJobSize, costOfMarketing };
  };

  const cur = calcMetrics(spendRecords, bookedLeads, appointmentLeads, soldLeads);
  const pri = calcMetrics(priorSpendRecords, priorBookedLeads, priorAppointmentLeads, priorSoldLeads);

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <ClientSidebar user={user} currentPage="ClientReport" />

      <main className="flex-1 min-w-0 pt-14 md:pt-6 px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Performance Report</h1>
            <p className="text-sm sm:text-base text-slate-400 mt-0.5 sm:mt-1">{clientInfo?.name || 'Loading...'}</p>
            {user.app_role === 'admin' && (
              <button
                onClick={() => { localStorage.removeItem('admin_view_client_id'); navigate(createPageUrl('AdminDashboard')); }}
                className="mt-1 text-xs text-slate-500 hover:text-[#D6FF03] transition-colors"
              >
                ← Back to Admin
              </button>
            )}
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        <ReportKPICards
          totalSpend={cur.totalSpend}
          appointmentsBooked={cur.appointmentsBooked}
          appointmentsShowed={cur.appointmentsShowed}
          jobsSold={cur.jobsSold}
          totalRevenue={cur.totalRevenue}
          showRate={cur.showRate}
          costPerAppointment={cur.costPerAppointment}
          roi={cur.roi}
          priorTotalSpend={pri.totalSpend}
          priorAppointmentsBooked={pri.appointmentsBooked}
          priorAppointmentsShowed={pri.appointmentsShowed}
          priorJobsSold={pri.jobsSold}
          priorTotalRevenue={pri.totalRevenue}
          priorShowRate={pri.showRate}
          priorCostPerAppointment={pri.costPerAppointment}
          priorRoi={pri.roi}
        />

        <ReportFunnel
          appointmentsBooked={cur.appointmentsBooked}
          appointmentsShowed={cur.appointmentsShowed}
          jobsSold={cur.jobsSold}
        />

        <ReportCalculations
          cancellationRate={cur.cancellationRate}
          winRate={cur.winRate}
          avgJobSize={cur.avgJobSize}
          costOfMarketing={cur.costOfMarketing}
          totalSpend={cur.totalSpend}
          totalRevenue={cur.totalRevenue}
          priorCancellationRate={pri.cancellationRate}
          priorWinRate={pri.winRate}
          priorAvgJobSize={pri.avgJobSize}
          priorCostOfMarketing={pri.costOfMarketing}
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