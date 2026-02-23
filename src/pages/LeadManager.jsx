import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import LeadManagerComponent from '../components/admin/LeadManager';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';

export default function LeadManager() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole !== 'admin') {
          if (appRole === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else if (appRole === 'setter') navigate(createPageUrl('SetterDashboard'));
          else if (appRole === 'client') navigate(createPageUrl('ClientPortal'));
          else if (appRole === 'onboard_admin') navigate(createPageUrl('OnboardDashboard'));
          else if (appRole === 'finance_admin') navigate(createPageUrl('FinanceAdminDashboard'));
          else navigate(createPageUrl('AccountPending'));
          return;
        }
        setUser(currentUser);
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  if (!user) return null;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="LeadManager" />
        <div className="flex-1 flex flex-col min-h-screen md:ml-0">
          <AdminMobileNav user={user} currentPage="LeadManager" />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            <h1 className="text-2xl font-bold text-white mb-6">Lead Management</h1>
            <LeadManagerComponent />
          </main>
        </div>
      </div>
    </PageErrorBoundary>
  );
}