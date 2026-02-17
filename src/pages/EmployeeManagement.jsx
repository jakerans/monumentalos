import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, UserPlus } from 'lucide-react';
import AdminNav from '../components/admin/AdminNav';
import EmployeeTable from '../components/employee/EmployeeTable';
import EmployeeDetailPanel from '../components/employee/EmployeeDetailPanel';
import AddEmployeeModal from '../components/employee/AddEmployeeModal';
import PerformancePayWidget from '../components/employee/PerformancePayWidget';
import PerformancePayDetailPanel from '../components/employee/PerformancePayDetailPanel';

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetailOpen, setPlanDetailOpen] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

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

  const { data: employees = [], refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: perfPlans = [], refetch: refetchPlans } = useQuery({
    queryKey: ['perf-plans'],
    queryFn: () => base44.entities.PerformancePay.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['emp-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

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

  const filtered = showDismissed
    ? employees.filter(e => e.status === 'dismissed')
    : employees.filter(e => e.status !== 'dismissed');

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="EmployeeManagement" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-slate-300" />
            <div>
              <h1 className="text-2xl font-bold text-white">Employee Management</h1>
              <p className="text-sm text-slate-400">{employees.filter(e => e.status === 'active').length} active employees</p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 text-sm font-bold text-black rounded-lg hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: '#D6FF03' }}
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* Status toggle */}
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

        <EmployeeTable employees={filtered} onSelect={handleSelectEmp} />

        {/* Performance Pay Section */}
        <PerformancePayWidget
          employees={employees}
          perfPlans={perfPlans}
          onSelectPlan={handleSelectPlan}
        />
      </main>

      <AddEmployeeModal open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />

      <EmployeeDetailPanel
        employee={selectedEmp}
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
    </div>
  );
}