import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import ProfitabilityKPIs from '../components/admin/ProfitabilityKPIs';
import ProfitabilityTable from '../components/admin/ProfitabilityTable';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import RevenueDashboardSkeleton from '../components/admin/RevenueDashboardSkeleton';

const PRESETS = [
  { label: 'MTD', getRange: () => [dayjs().startOf('month'), dayjs()] },
  { label: 'Last Month', getRange: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  { label: 'Last Quarter', getRange: () => {
    const q = Math.floor((dayjs().month() - 1) / 3);
    const qStart = q < 0
      ? dayjs().subtract(1, 'year').month(9).startOf('month')
      : dayjs().month(q * 3).startOf('month');
    return [qStart.subtract(3, 'month').startOf('month'), qStart.subtract(1, 'day')];
  }},
  { label: 'YTD', getRange: () => [dayjs().startOf('year'), dayjs()] },
];

export default function ClientProfitability() {
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
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['client-profitability', startDate, endDate],
    queryFn: async () => {
      const res = await base44.functions.invoke('getClientProfitabilityData', { start_date: startDate, end_date: endDate });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const applyPreset = (preset) => {
    const [s, e] = preset.getRange();
    setStartDate(s.format('YYYY-MM-DD'));
    setEndDate(e.format('YYYY-MM-DD'));
  };

  if (!user) return null;
  if (isLoading) return <RevenueDashboardSkeleton />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="ClientProfitability" clients={data?.clients?.map(c => ({ id: c.client_id, name: c.client_name })) || []} />
        <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Client Profitability</h1>
              <p className="text-sm text-slate-400">Net profit and margin per client</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-md border border-slate-700/50 text-slate-300 hover:bg-[#D6FF03]/10 hover:text-[#D6FF03] hover:border-[#D6FF03]/30 transition-colors"
                >
                  {p.label}
                </button>
              ))}
              <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
            </div>
          </div>

          {/* KPIs */}
          <ProfitabilityKPIs summary={data?.summary} />

          {/* Table */}
          <ProfitabilityTable clients={data?.clients} />
        </main>
        <AdminMobileNav currentPage="ClientProfitability" clients={data?.clients?.map(c => ({ id: c.client_id, name: c.client_name })) || []} />
      </div>
    </PageErrorBoundary>
  );
}