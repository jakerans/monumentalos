import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, UserPlus, RefreshCw, Settings, DollarSign, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import EmployeeTable from '../components/employee/EmployeeTable';
import EmployeeDetailPanel from '../components/employee/EmployeeDetailPanel';
import AddEmployeeModal from '../components/employee/AddEmployeeModal';
import PerformancePayWidget from '../components/employee/PerformancePayWidget';
import PerformancePayDetailPanel from '../components/employee/PerformancePayDetailPanel';
import PayrollSettingsModal from '../components/employee/PayrollSettingsModal';
import RunPayrollModal from '../components/admin/RunPayrollModal';
import { getCyclesPerYear } from '../components/employee/payUtils';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SetterBonusSummaryTab from '../components/loot/SetterBonusSummaryTab';
import PayrollTourGuide from '../components/admin/PayrollTourGuide';

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailOpen, setPlanDetailOpen] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [runPayrollOpen, setRunPayrollOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('roster');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin') {
          navigate(createPageUrl('AccountPending'));
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: dashData, refetch: refetchAll, isLoading: empLoading } = useQuery({
    queryKey: ['employee-management-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEmployeeManagementData');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const employees = dashData?.employees || [];
  const perfPlans = dashData?.perfPlans || [];
  const clients = dashData?.clients || [];
  const payrollSettings = dashData?.payrollSettings || null;
  const users = dashData?.users || [];
  const lastMonthCollected = dashData?.lastMonthCollected || 0;
  const perfRecords = dashData?.perfRecords || [];

  const refetch = refetchAll;
  const refetchPlans = refetchAll;
  const refetchSettings = refetchAll;

  const [syncing, setSyncing] = useState(false);

  const handleSyncFromUsers = async () => {
    setSyncing(true);
    const internalRoles = ['admin', 'marketing_manager', 'setter', 'onboard_admin'];
    const internalUsers = users.filter(u => internalRoles.includes(u.app_role));
    const existingUserIds = new Set(employees.filter(e => e.user_id).map(e => e.user_id));
    const existingEmails = new Set(employees.map(e => e.email?.toLowerCase()).filter(Boolean));
    
    const toCreate = internalUsers.filter(u => 
      !existingUserIds.has(u.id) && !existingEmails.has(u.email?.toLowerCase())
    );

    if (toCreate.length === 0) {
      setSyncing(false);
      return;
    }

    const newEmployees = toCreate.map(u => ({
      user_id: u.id,
      full_name: u.full_name || u.email,
      email: u.email,
      app_role: u.app_role,
      classification: 'salary',
      cost_type: 'overhead',
      discipline_status: 'green',
      status: 'active',
    }));

    await base44.entities.Employee.bulkCreate(newEmployees);
    refetch();
    setSyncing(false);
  };

  const handleAdd = async (data) => {
    await base44.entities.Employee.create(data);
    refetch();
  };

  const handleSelectEmp = (emp) => {
    setSelectedEmp(emp);
    setEmpDetailOpen(true);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPlanDetailOpen(true);
  };

  const handleUpdated = () => {
    refetch();
    refetchPlans();
    // Refresh the selected employee if panel is open
    if (selectedEmp) {
      const fresh = employees.find(e => e.id === selectedEmp.id);
      if (fresh) setSelectedEmp(fresh);
    }
  };

  if (!user) return null;
  if (empLoading) return <PageLoader message="Loading employees..." />;

  const filtered = showDismissed
    ? employees.filter(e => e.status === 'dismissed')
    : employees.filter(e => e.status !== 'dismissed');

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="EmployeeManagement" clients={clients} />

      <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-slate-300 hidden sm:block" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Employee Management</h1>
              <p className="text-xs sm:text-sm text-slate-400">{employees.filter(e => e.status === 'active').length} active employees</p>
            </div>
          </div>
          <button
            onClick={() => setPayrollOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 sm:gap-2"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Payroll:</span>
            <span className="text-[10px] sm:text-xs font-bold text-white capitalize">{payrollSettings?.payroll_frequency?.replace('_', '-') || 'Bi-Weekly'}</span>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="roster">Team Roster</TabsTrigger>
            <TabsTrigger value="performance">Performance Pay</TabsTrigger>
            <TabsTrigger value="payroll">💰 Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddOpen(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Employee
              </button>
              <button
                onClick={handleSyncFromUsers}
                disabled={syncing}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Sync from Users
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDismissed(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${!showDismissed ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
              >
                Active ({employees.filter(e => e.status !== 'dismissed').length})
              </button>
              <button
                onClick={() => setShowDismissed(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${showDismissed ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
              >
                Dismissed ({employees.filter(e => e.status === 'dismissed').length})
              </button>
            </div>

            <EmployeeTable employees={filtered} payrollSettings={payrollSettings} onSelect={handleSelectEmp} lastMonthCollected={lastMonthCollected} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformancePayWidget
              employees={employees}
              perfPlans={perfPlans}
              payrollSettings={payrollSettings}
              onSelectPlan={handleSelectPlan}
              perfRecords={perfRecords}
            />
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            {/* Period context header */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Payroll Period: {dayjs().subtract(1, 'month').format('MMMM YYYY')}
              </span>
            </div>

            <div className="flex justify-end mb-2">
              <PayrollTourGuide setRunPayrollModalOpen={setRunPayrollOpen} />
            </div>

            {/* Step 1 — Review Setter Bonuses */}
            <div data-tour="setter-bonuses-section">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Step 1 — Review Setter Bonuses</p>
              <SetterBonusSummaryTab defaultPeriod={dayjs().subtract(1, 'month').format('YYYY-MM')} />
            </div>

            <div className="border-t border-slate-700/50" />

            {/* Step 2 — Run Payroll */}
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Step 2 — Run Payroll</p>
            <p className="text-xs text-slate-500 italic">Setter bonuses from the prior month are loaded automatically.</p>
            <div className="flex justify-end">
              <button
                data-tour="run-payroll-btn"
                onClick={() => setRunPayrollOpen(true)}
                className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: '#D6FF03' }}
              >
                <DollarSign className="w-4 h-4" />
                Run Payroll
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddEmployeeModal open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />

      <EmployeeDetailPanel
        employee={selectedEmp}
        payrollSettings={payrollSettings}
        open={empDetailOpen}
        onOpenChange={setEmpDetailOpen}
        onUpdated={handleUpdated}
      />

      <PerformancePayDetailPanel
        plan={selectedPlan}
        employees={employees}
        open={planDetailOpen}
        onOpenChange={setPlanDetailOpen}
        onUpdated={handleUpdated}
      />

      <PayrollSettingsModal
        open={payrollOpen}
        onOpenChange={setPayrollOpen}
        settings={payrollSettings}
        onSaved={refetchSettings}
      />
      <RunPayrollModal
        open={runPayrollOpen}
        onOpenChange={setRunPayrollOpen}
        onComplete={refetch}
      />
      <AdminMobileNav currentPage="EmployeeManagement" clients={clients} />
    </div>
    </PageErrorBoundary>
  );
}