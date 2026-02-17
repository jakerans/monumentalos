import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Pencil, Check, X, Trash2 } from 'lucide-react';

const ROLE_LABELS = {
  admin: { label: 'Admin', bg: 'bg-purple-100 text-purple-700' },
  marketing_manager: { label: 'Marketing Manager', bg: 'bg-blue-100 text-blue-700' },
  setter: { label: 'Setter', bg: 'bg-amber-100 text-amber-700' },
  onboard_admin: { label: 'Onboard Admin', bg: 'bg-teal-100 text-teal-700' },
  client: { label: 'Client', bg: 'bg-gray-100 text-gray-700' },
  user: { label: 'User', bg: 'bg-gray-100 text-gray-500' },
};

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'setter', label: 'Setter' },
  { value: 'onboard_admin', label: 'Onboard Admin' },
  { value: 'client', label: 'Client' },
  { value: 'user', label: 'User' },
];

export default function UserTable({ users, clients = [], onUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (userId) => {
    setSaving(true);
    await base44.entities.User.delete(userId);
    setSaving(false);
    setDeletingId(null);
    if (onUpdated) onUpdated();
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditRole(user.app_role || 'user');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRole('');
  };

  const saveRole = async (userId) => {
    setSaving(true);
    await base44.entities.User.update(userId, { app_role: editRole });
    setSaving(false);
    setEditingId(null);
    if (onUpdated) onUpdated();
  };
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
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">No users found</td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs font-medium text-gray-900">{user.full_name || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  {editingId === user.id ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button onClick={() => saveRole(user.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(user.app_role || 'user')}
                      <button onClick={() => startEdit(user)} className="p-0.5 text-gray-400 hover:text-gray-600 rounded">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{user.app_role === 'client' ? getClientName(user.client_id) : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {user.created_date ? new Date(user.created_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {deletingId === user.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[10px] text-red-600 font-medium mr-1">Delete?</span>
                      <button onClick={() => handleDelete(user.id)} disabled={saving} className="px-2 py-1 text-[10px] font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                        Yes
                      </button>
                      <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(user.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}