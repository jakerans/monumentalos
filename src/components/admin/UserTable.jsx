import React from 'react';

const ROLE_LABELS = {
  admin: { label: 'Admin', bg: 'bg-purple-100 text-purple-700' },
  marketing_manager: { label: 'Marketing Manager', bg: 'bg-blue-100 text-blue-700' },
  setter: { label: 'Setter', bg: 'bg-amber-100 text-amber-700' },
  onboard_admin: { label: 'Onboard Admin', bg: 'bg-teal-100 text-teal-700' },
  client: { label: 'Client', bg: 'bg-gray-100 text-gray-700' },
  user: { label: 'User', bg: 'bg-gray-100 text-gray-500' },
};

export default function UserTable({ users, clients = [] }) {
  const getClientName = (clientId) => {
    if (!clientId) return '—';
    const c = clients.find(cl => cl.id === clientId);
    return c?.name || clientId;
  };

  const getRoleBadge = (role) => {
    const info = ROLE_LABELS[role] || ROLE_LABELS.user;
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${info.bg}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Client</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">No users found</td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs font-medium text-gray-900">{user.full_name || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{user.email}</td>
                <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{user.role === 'client' ? getClientName(user.client_id) : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {user.created_date ? new Date(user.created_date).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}