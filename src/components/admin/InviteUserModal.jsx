import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'setter', label: 'Setter' },
  { value: 'onboard_admin', label: 'Onboard Admin' },
  { value: 'client', label: 'Client' },
];

export default function InviteUserModal({ open, onOpenChange, clients = [], onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('setter');
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (role === 'client' && !clientId) { setError('Please select a client for client users'); return; }

    setSaving(true);
    try {
      // inviteUser only accepts "user" or "admin", so invite as the base role first
      const inviteRole = role === 'admin' ? 'admin' : 'user';
      await base44.users.inviteUser(email.trim(), inviteRole);

      // Wait a moment for the user record to be created, then update their custom role
      if (role !== 'admin' && role !== 'user') {
        // Retry a few times to find the newly created user
        let newUser = null;
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const allUsers = await base44.entities.User.list();
          newUser = allUsers.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (newUser) break;
        }

        if (newUser) {
          const updateData = { role };
          if (role === 'client' && clientId) {
            updateData.client_id = clientId;
          }
          await base44.entities.User.update(newUser.id, updateData);
        }
      } else if (role === 'user' && clientId) {
        // For client role invited as 'user', also assign client_id
        let newUser = null;
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const allUsers = await base44.entities.User.list();
          newUser = allUsers.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (newUser) break;
        }
        if (newUser) {
          await base44.entities.User.update(newUser.id, { client_id: clientId });
        }
      }

      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      setRole('setter');
      setClientId('');
      if (onInvited) onInvited();
    } catch (err) {
      setError(err?.message || 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {role === 'client' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assign to Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}

          <button
            onClick={handleInvite}
            disabled={saving}
            className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}