import React, { useState, forwardRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Pencil, Check, X, Trash2, Copy, Link as LinkIcon } from 'lucide-react';
import FlipMove from 'react-flip-move';
import ConnectUserModal from './ConnectUserModal';

const ROLE_LABELS = {
  admin: { label: 'Admin', bg: 'bg-purple-100 text-purple-700' },
  finance_admin: { label: 'Finance Admin', bg: 'bg-cyan-100 text-cyan-700' },
  marketing_manager: { label: 'Marketing Manager', bg: 'bg-blue-100 text-blue-700' },
  setter: { label: 'Setter', bg: 'bg-amber-100 text-amber-700' },
  onboard_admin: { label: 'Onboard Admin', bg: 'bg-teal-100 text-teal-700' },
  client: { label: 'Client', bg: 'bg-gray-100 text-gray-700' },
  user: { label: 'User', bg: 'bg-gray-100 text-gray-500' },
};

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'finance_admin', label: 'Finance Admin' },
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
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedUserForConnect, setSelectedUserForConnect] = useState(null);

  const handleDelete = async (userId) => {
    const u = users.find(x => x.id === userId);
    setSaving(true);
    await base44.entities.User.delete(userId);
    setSaving(false);
    setDeletingId(null);
    toast({ title: 'User Deleted', description: `${u?.full_name || u?.email || 'User'} has been removed.`, variant: 'destructive' });
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
    const u = users.find(x => x.id === userId);
    setSaving(true);
    await base44.entities.User.update(userId, { app_role: editRole });
    setSaving(false);
    setEditingId(null);
    toast({ title: 'Role Updated', description: `${u?.full_name || 'User'} is now ${editRole}.`, variant: 'success' });
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

  const handleOpenConnect = (user) => {
    setSelectedUserForConnect(user);
    setConnectOpen(true);
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-slate-700/30">
        {users.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-500">No users found</div>
        ) : users.map(u => (
          <div key={u.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{u.full_name || '—'}</p>
                <p className="text-[11px] text-slate-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {editingId === u.id ? (
                  <div className="flex items-center gap-1">
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none">
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button onClick={() => saveRole(u.id)} disabled={saving} className="p-1 text-green-600"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEdit} className="p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {getRoleBadge(u.app_role || 'user')}
                    <button onClick={() => startEdit(u)} className="p-0.5 text-gray-400"><Pencil className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{u.created_date ? new Date(u.created_date).toLocaleDateString() : ''}</span>
              {deletingId === u.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-red-600 font-medium">Delete?</span>
                  <button onClick={() => handleDelete(u.id)} disabled={saving} className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded">Yes</button>
                  <button onClick={() => setDeletingId(null)} className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">No</button>
                </div>
              ) : (
                <button onClick={() => setDeletingId(u.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">User ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Client</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <FlipMove typeName="tbody" duration={350} easing="cubic-bezier(0.25, 0.46, 0.45, 0.94)" staggerDurationBy={15} enterAnimation="fade" leaveAnimation="fade" className="divide-y divide-slate-700/30">
            {users.length === 0 ? (
              <tr key="empty">
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">No users found</td>
              </tr>
            ) : users.map(u => (
              <UserRow key={u.id} user={u} editingId={editingId} editRole={editRole} setEditRole={setEditRole} saving={saving} startEdit={startEdit} cancelEdit={cancelEdit} saveRole={saveRole} deletingId={deletingId} setDeletingId={setDeletingId} handleDelete={handleDelete} getRoleBadge={getRoleBadge} getClientName={getClientName} toast={toast} onConnect={handleOpenConnect} />
            ))}
          </FlipMove>
        </table>
      </div>
      </div>

      <ConnectUserModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        user={selectedUserForConnect}
        employees={[]}
        clients={clients}
        onConnected={onUpdated}
      />
    </>
  );
}

const UserRow = forwardRef(({ user, editingId, editRole, setEditRole, saving, startEdit, cancelEdit, saveRole, deletingId, setDeletingId, handleDelete, getRoleBadge, getClientName, toast, onConnect }, ref) => {
  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    toast({ title: 'Copied', description: 'User ID copied to clipboard', duration: 2000 });
  };

  return (
  <tr ref={ref} className="hover:bg-slate-700/20">
    <td className="px-4 py-3 text-xs font-medium text-white">{user.full_name || '—'}</td>
    <td className="px-4 py-3 text-xs text-slate-400">{user.email}</td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-1.5">
        <code className="text-[10px] bg-slate-900/50 px-2 py-1 rounded text-slate-300 font-mono">{user.id}</code>
        <button onClick={handleCopyId} className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700/30" title="Copy User ID"><Copy className="w-3.5 h-3.5" /></button>
      </div>
    </td>
    <td className="px-4 py-3">
      {editingId === user.id ? (
        <div className="flex items-center gap-1">
          <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[{ value: 'admin', label: 'Admin' }, { value: 'finance_admin', label: 'Finance Admin' }, { value: 'marketing_manager', label: 'Marketing Manager' }, { value: 'setter', label: 'Setter' }, { value: 'onboard_admin', label: 'Onboard Admin' }, { value: 'client', label: 'Client' }, { value: 'user', label: 'User' }].map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button onClick={() => saveRole(user.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {getRoleBadge(user.app_role || 'user')}
          <button onClick={() => startEdit(user)} className="p-0.5 text-gray-400 hover:text-gray-600 rounded"><Pencil className="w-3 h-3" /></button>
        </div>
      )}
    </td>
    <td className="px-4 py-3 text-xs text-slate-400">{user.app_role === 'client' ? getClientName(user.client_id) : '—'}</td>
    <td className="px-4 py-3 text-xs text-slate-500">{user.created_date ? new Date(user.created_date).toLocaleDateString() : '—'}</td>
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-1">
        {deletingId === user.id ? (
          <>
            <span className="text-[10px] text-red-600 font-medium mr-1">Delete?</span>
            <button onClick={() => handleDelete(user.id)} disabled={saving} className="px-2 py-1 text-[10px] font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">Yes</button>
            <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">No</button>
          </>
        ) : (
          <>
            <button onClick={() => onConnect(user)} className="p-1 text-slate-500 hover:text-blue-400 rounded hover:bg-blue-500/10 transition-colors" title="Connect to Employee/Client"><LinkIcon className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeletingId(user.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </>
        )}
      </div>
      </td>
      </tr>
      );
      });