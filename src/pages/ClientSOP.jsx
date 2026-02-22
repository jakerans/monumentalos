import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ClientViewNav from '../components/clientview/ClientViewNav';
import ClientSOPEditor from '../components/clientview/ClientSOPEditor';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import { FileText } from 'lucide-react';

export default function ClientSOP() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');
  const clientName = urlParams.get('clientName') || '';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  if (!user) return null;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
        <ClientViewNav user={user} clientName={clientName} />

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-5 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{clientName || 'Client SOP'}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Standard Operating Procedures</p>
            </div>
            <button
              onClick={() => navigate(createPageUrl('ClientView') + `?clientId=${clientId}`)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-800"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Tab bar - mirrors ClientView style */}
          <div className="flex items-center gap-1 border-b border-slate-700/50 pb-0">
            <button
              onClick={() => navigate(createPageUrl('ClientView') + `?clientId=${clientId}`)}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors border-transparent text-slate-400 hover:text-white"
            >
              Overview
            </button>
            <button
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 border-[#D6FF03] text-[#D6FF03]"
            >
              <FileText className="w-3.5 h-3.5" />
              SOP
            </button>
          </div>

          <ClientSOPEditor clientId={clientId} />
        </main>
      </div>
    </PageErrorBoundary>
  );
}