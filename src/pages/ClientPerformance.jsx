import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import ClientWorkspaceKPIs from '../components/admin/ClientWorkspaceKPIs';
import ClientGrid from '../components/admin/ClientGrid';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { motion } from 'framer-motion';
import { getEffectsEnabled } from '../components/shared/useEffectsToggle';

export default function ClientPerformance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const effectsOn = getEffectsEnabled();

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

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading client workspace..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="ClientPerformance" clients={clients} />
      <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div
          initial={effectsOn ? { opacity: 0, y: 16 } : false}
          animate={effectsOn ? { opacity: 1, y: 0 } : false}
          transition={effectsOn ? { duration: 0.4 } : { duration: 0 }}
        >
          <h1 className="text-2xl font-bold text-white">Client Overview</h1>
          <p className="text-sm text-slate-400">High-level overview of all clients, goals, and industries</p>
        </motion.div>

        <motion.div
          initial={effectsOn ? { opacity: 0, y: 20 } : false}
          animate={effectsOn ? { opacity: 1, y: 0 } : false}
          transition={effectsOn ? { delay: 0.1, duration: 0.4 } : { duration: 0 }}
        >
          <ClientWorkspaceKPIs clients={clients} />
        </motion.div>

        <motion.div
          initial={effectsOn ? { opacity: 0, y: 20 } : false}
          animate={effectsOn ? { opacity: 1, y: 0 } : false}
          transition={effectsOn ? { delay: 0.2, duration: 0.4 } : { duration: 0 }}
          className="space-y-4"
        >
          <ClientGrid clients={clients} leads={leads} onRefresh={refetch} />
        </motion.div>
      </main>
      <AdminMobileNav currentPage="ClientPerformance" clients={clients} />
    </div>
    </PageErrorBoundary>
  );
}