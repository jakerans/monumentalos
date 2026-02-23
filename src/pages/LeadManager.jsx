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
    base44.auth.me().then(u => {
      if (!u || u.app_role !== 'admin') navigate(createPageUrl('Login'));
      else setUser(u);
    });
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