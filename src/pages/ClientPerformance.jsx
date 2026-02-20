import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import ClientOverviewTable from '../components/admin/ClientOverviewTable';
import ClientPerfKPIs from '../components/admin/ClientPerfKPIs';
import ClientPerfCharts from '../components/admin/ClientPerfCharts';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

export default function ClientPerformance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: dashData, isLoading, refetch } = useQuery({
    queryKey: ['client-performance-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getClientPerformanceData');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const clients = dashData?.clients || [];
  const leads = dashData?.leads || [];
  const spend = dashData?.spend || [];
  const payments = dashData?.payments || [];

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading client performance..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="ClientPerformance" clients={clients} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Performance</h1>
          <p className="text-sm text-slate-400">Detailed client metrics and trends</p>
        </div>

        <ClientPerfKPIs clients={clients} leads={leads} spend={spend} />
        <ClientPerfCharts clients={clients} leads={leads} spend={spend} />
        <ClientOverviewTable clients={clients} leads={leads} spend={spend} payments={payments} onRefresh={refetch} />
      </main>
      <AdminMobileNav currentPage="ClientPerformance" clients={clients} />
    </div>
    </PageErrorBoundary>
  );
}