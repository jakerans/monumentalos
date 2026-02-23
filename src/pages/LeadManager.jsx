import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import LeadManagerComponent from '../components/admin/LeadManager';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import BugReportWidget from '../components/shared/BugReportWidget';

export default function LeadManager() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const appRole = currentUser.app_role;
        if (!appRole || (appRole !== 'admin' && appRole !== 'finance_admin')) {
          navigate(createPageUrl('AdminDashboard'));
        }
        // Fetch clients for sidebar
        const allClients = await base44.entities.Client.list();
        setClients(allClients || []);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  if (!user) return null;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="LeadManager" clients={clients} />

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-700/50 bg-slate-900/30 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-white">Lead Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review deletion requests and manage leads</p>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <LeadManagerComponent />
        </div>
      </main>

      <AdminMobileNav currentPage="LeadManager" clients={clients} user={user} />
      <BugReportWidget user={user} />
    </div>
    </PageErrorBoundary>
  );
}