import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UserPlus, Users } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import UserTable from '../components/admin/UserTable';
import InviteUserModal from '../components/admin/InviteUserModal';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

export default function UserManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

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

  const { data: mgmtData, refetch: refetchAll, isLoading: usersLoading } = useQuery({
    queryKey: ['user-management-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUserManagementData');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const users = mgmtData?.users || [];
  const clients = mgmtData?.clients || [];
  const refetchUsers = refetchAll;

  if (!user) return null;
  if (usersLoading) return <PageLoader message="Loading users..." />;

  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter(u => u.app_role === roleFilter);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.app_role || 'unassigned'] = (acc[u.app_role || 'unassigned'] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="UserManagement" clients={clients} />

      <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>
              <p className="text-xs sm:text-sm text-slate-400">{users.length} total users</p>
            </div>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-black rounded-lg hover:opacity-90 flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto" style={{backgroundColor:'#D6FF03'}}
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Invite User
          </button>
        </div>

        {/* Role filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              roleFilter === 'all' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            All ({users.length})
          </button>
          {[
            { value: 'admin', label: 'Admin' },
            { value: 'finance_admin', label: 'Finance Admin' },
            { value: 'marketing_manager', label: 'Marketing Manager' },
            { value: 'setter', label: 'Setter' },
            { value: 'onboard_admin', label: 'Onboard Admin' },
            { value: 'client', label: 'Client' },
          ].map(r => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                roleFilter === r.value ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {r.label} ({roleCounts[r.value] || 0})
            </button>
          ))}
        </div>

        <UserTable users={filteredUsers} clients={clients} onUpdated={refetchUsers} />
      </main>

      <InviteUserModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        clients={clients}
        onInvited={refetchUsers}
      />
      <AdminMobileNav currentPage="UserManagement" clients={clients} user={user} />
    </div>
    </PageErrorBoundary>
  );
}