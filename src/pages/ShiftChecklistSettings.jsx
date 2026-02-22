import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
import ShiftChecklistEditor from '@/components/admin/ShiftChecklistEditor';
import PageErrorBoundary from '@/components/shared/PageErrorBoundary';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';

export default function ShiftChecklistSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const appRole = currentUser.app_role;
        if (appRole !== 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: dashData } = useQuery({
    queryKey: ['admin-clients-minimal'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAdminDashboardData');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const clients = dashData?.clients || [];

  if (!user) return null;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="ShiftChecklistSettings" clients={clients} />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <ShiftChecklistEditor />
          </div>
        </main>
        <AdminMobileNav currentPage="ShiftChecklistSettings" clients={clients} user={user} />
      </div>
    </PageErrorBoundary>
  );
}