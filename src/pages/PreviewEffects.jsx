import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import MMPerformanceGoal from '../components/mm/MMPerformanceGoal';
import RankPreviewTester from '../components/mm/RankPreviewTester';
import SpiffPreviewTester from '../components/admin/SpiffPreviewTester';
import STLPreviewTester from '../components/admin/STLPreviewTester';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PreviewEffects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const role = currentUser.app_role;
        if (role !== 'admin') {
          const dest = role === 'marketing_manager' ? 'MMDashboard'
            : role === 'setter' ? 'SetterDashboard'
            : role === 'onboard_admin' ? 'OnboardDashboard'
            : role === 'client' ? 'ClientPortal'
            : 'AccountPending';
          navigate(createPageUrl(dest));
          return;
        }
        setUser(currentUser);
      } catch {
        base44.auth.redirectToLogin();
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading || !user) return <PageLoader message="Loading..." />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="PreviewEffects" clients={[]} />

        <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">Preview Effects</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Test how widgets and animations look at different states.
            </p>
          </motion.div>

          {/* Performance Goal Tester + Rank Tester */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MMPerformanceGoal plans={[]} showTester={true} />
            <RankPreviewTester />
          </div>

          {/* Spiff Widget Tester + STL Widget Tester */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <SpiffPreviewTester />
            </div>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <STLPreviewTester />
            </div>
          </div>
        </main>

        <AdminMobileNav currentPage="PreviewEffects" clients={[]} />
      </div>
    </PageErrorBoundary>
  );
}