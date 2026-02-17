import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import AdminNav from '../components/admin/AdminNav';
import SetterPerformanceTable from '../components/admin/SetterPerformanceTable';
import DateRangePicker from '../components/admin/DateRangePicker';
import SpiffManager from '../components/admin/SpiffManager';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

export default function SetterPerformance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin') {
          if (currentUser.app_role === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else navigate(createPageUrl('SetterDashboard'));
        }
      } catch (error) { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: clients = [] } = useQuery({
    queryKey: ['sp-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['sp-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 5000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['sp-users'],
    queryFn: () => base44.entities.User.list(),
  });

  if (!user) return null;
  if (leadsLoading) return <PageLoader message="Loading setter performance..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="SetterPerformance" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Setter Performance</h1>
            <p className="text-sm text-slate-400">Track setter productivity, speed-to-lead, and conversion rates</p>
          </div>
          <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        </div>

        <SetterPerformanceTable users={users} leads={leads} clients={clients} startDate={startDate} endDate={endDate} />

        <SpiffManager leads={leads} users={users} />
      </main>
    </div>
    </PageErrorBoundary>
  );
}