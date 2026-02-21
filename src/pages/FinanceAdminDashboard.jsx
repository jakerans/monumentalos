import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Receipt, Tag, CheckSquare, DollarSign, Play } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function formatCurrency(val) {
  return '$' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function StatusBadge({ color, children }) {
  const colors = {
    red: 'bg-red-500/20 text-red-400',
    yellow: 'bg-amber-500/20 text-amber-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    slate: 'bg-slate-600/40 text-slate-400',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}

function TaskCard({ icon: Icon, iconColor, title, cadence, badge, metric, metricSub, buttonLabel, buttonTo }) {
  const iconColors = {
    blue: 'text-blue-400 bg-blue-500/15',
    orange: 'text-orange-400 bg-orange-500/15',
    green: 'text-emerald-400 bg-emerald-500/15',
    purple: 'text-purple-400 bg-purple-500/15',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[iconColor] || iconColors.blue}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{cadence}</p>
          </div>
        </div>
        {badge}
      </div>

      <div className="flex-1 mb-4">
        <p className="text-lg font-bold text-white">{metric}</p>
        {metricSub && <p className="text-xs text-slate-500 mt-0.5">{metricSub}</p>}
      </div>

      <Link
        to={createPageUrl(buttonTo)}
        className="block w-full text-center px-4 py-2 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#D6FF03', color: '#000' }}
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700/60" />
            <div className="space-y-1.5">
              <div className="w-28 h-4 rounded bg-slate-700/60" />
              <div className="w-36 h-2.5 rounded bg-slate-700/40" />
            </div>
          </div>
          <div className="w-32 h-6 rounded bg-slate-700/60" />
          <div className="w-full h-9 rounded-lg bg-slate-700/40" />
        </div>
      ))}
    </div>
  );
}

export default function FinanceAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const allowed = ['admin', 'finance_admin'];
        if (!allowed.includes(currentUser.app_role)) {
          if (currentUser.app_role === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else navigate(createPageUrl('SetterDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['finance-admin-dashboard'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFinanceAdminDashboardData', {});
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    enabled: !!user,
  });

  if (!user) return null;

  const billing = data?.billing || {};
  const expenses = data?.expenses || {};
  const monthlyClose = data?.monthlyClose || {};
  const payroll = data?.payroll || {};

  // Badge builders
  const billingBadge = billing.overdueCount > 0
    ? <StatusBadge color="red">{billing.overdueCount} overdue</StatusBadge>
    : billing.pendingCount > 0
      ? <StatusBadge color="yellow">{billing.pendingCount} pending</StatusBadge>
      : <StatusBadge color="green">All clear</StatusBadge>;

  const expenseBadge = expenses.uncategorizedCount > 10
    ? <StatusBadge color="red">{expenses.uncategorizedCount} uncategorized</StatusBadge>
    : expenses.uncategorizedCount > 0
      ? <StatusBadge color="yellow">{expenses.uncategorizedCount} uncategorized</StatusBadge>
      : <StatusBadge color="green">All categorized</StatusBadge>;

  const closeBadge = monthlyClose.closedAlready
    ? <StatusBadge color="green">Closed</StatusBadge>
    : <StatusBadge color="yellow">Open — not yet closed</StatusBadge>;

  const payrollBadge = <StatusBadge color="slate">Manual process</StatusBadge>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="FinanceAdminDashboard" clients={[]} />

      <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Finance Admin</h1>
            <p className="text-sm text-slate-400">Your workspace — everything you need to manage billing, expenses, payroll, and the books.</p>
          </div>
          <button
            onClick={() => setTourOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-800 transition-colors"
          >
            <Play className="w-3 h-3" />
            How to use this workspace
          </button>
        </div>

        {/* Task Cards */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400 text-sm font-medium">Failed to load dashboard data. Please refresh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TaskCard
              icon={Receipt}
              iconColor="blue"
              title="Billing Review"
              cadence="Weekly — every Monday"
              badge={billingBadge}
              metric={`Total AR: ${formatCurrency(billing.totalAR)}`}
              metricSub={billing.lastReviewDate ? `Last reviewed: ${formatDate(billing.lastReviewDate)}` : 'Not reviewed this week'}
              buttonLabel="Start Billing Review →"
              buttonTo="MonthlyBilling"
            />
            <TaskCard
              icon={Tag}
              iconColor="orange"
              title="Expense Categorization"
              cadence="Ongoing — do this daily or weekly"
              badge={expenseBadge}
              metric={expenses.uncategorizedCount > 0 ? `${expenses.uncategorizedCount} expenses need review` : 'Nothing to categorize'}
              buttonLabel="Start Categorizing →"
              buttonTo="AccountingExpenses"
            />
            <TaskCard
              icon={CheckSquare}
              iconColor="green"
              title="Monthly Close"
              cadence="Monthly — due by the 5th"
              badge={closeBadge}
              metric={`Closing: ${formatMonthYear(monthlyClose.closeTarget)}`}
              buttonLabel="Start Month Close →"
              buttonTo="AccountingExpenses"
            />
            <TaskCard
              icon={DollarSign}
              iconColor="purple"
              title="Payroll"
              cadence="Biweekly"
              badge={payrollBadge}
              metric={payroll.lastPayrollDate ? `Last run: ${formatDate(payroll.lastPayrollDate)}` : 'No payroll runs found'}
              buttonLabel="Go to Payroll →"
              buttonTo="EmployeeManagement"
            />
          </div>
        )}
      </main>

      <AdminMobileNav currentPage="FinanceAdminDashboard" clients={[]} />

      {/* Tour placeholder modal */}
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Workspace Tour</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">Tour guide coming soon.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}