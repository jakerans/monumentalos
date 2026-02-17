import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import ClientOverviewTable from '../components/admin/ClientOverviewTable';
import ClientPerfKPIs from '../components/admin/ClientPerfKPIs';
import ClientPerfCharts from '../components/admin/ClientPerfCharts';

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

  const { data: clients = [] } = useQuery({
    queryKey: ['perf-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['perf-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 5000),
  });

  const { data: spend = [] } = useQuery({
    queryKey: ['perf-spend'],
    queryFn: () => base44.entities.Spend.list('-date', 5000),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['perf-payments'],
    queryFn: () => base44.entities.Payment.list('-date', 5000),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} currentPage="ClientPerformance" clients={clients} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Performance</h1>
          <p className="text-sm text-gray-500">Detailed client metrics and trends</p>
        </div>

        <ClientPerfKPIs clients={clients} leads={leads} spend={spend} />
        <ClientPerfCharts clients={clients} leads={leads} spend={spend} />
        <ClientOverviewTable clients={clients} leads={leads} spend={spend} payments={payments} />
      </main>
    </div>
  );
}