import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UserPlus, Users } from 'lucide-react';
import AdminNav from '../components/admin/AdminNav';
import UserTable from '../components/admin/UserTable';
import InviteUserModal from '../components/admin/InviteUserModal';

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
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('SetterDashboard'));
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['manage-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['manage-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  if (!user) return null;

  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter(u => u.role === roleFilter);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} currentPage="UserManagement" clients={clients} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500">{users.length} total users</p>
            </div>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Invite User
          </button>
        </div>

        {/* Role filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              roleFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({users.length})
          </button>
          {[
            { value: 'admin', label: 'Admin' },
            { value: 'marketing_manager', label: 'Marketing Manager' },
            { value: 'setter', label: 'Setter' },
            { value: 'onboard_admin', label: 'Onboard Admin' },
            { value: 'client', label: 'Client' },
          ].map(r => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                roleFilter === r.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {r.label} ({roleCounts[r.value] || 0})
            </button>
          ))}
        </div>

        <UserTable users={filteredUsers} clients={clients} />
      </main>

      <InviteUserModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        clients={clients}
        onInvited={refetchUsers}
      />
    </div>
  );
}