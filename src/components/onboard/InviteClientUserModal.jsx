import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Check, Copy } from 'lucide-react';

export default function InviteClientUserModal({ open, onOpenChange, client }) {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(client?.id || '');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleInvite = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Email is required'); return; }

    setSaving(true);
    try {
      await base44.functions.invoke('inviteClientUser', {
        email: email.trim(),
        intended_role: 'client',
        client_id: client.id,
      });

      setSuccess(`Invitation sent to ${email} — linked to ${client.name}`);
      setEmail('');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User to {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Client ID display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Client ID (for Zapier)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-white px-2.5 py-1.5 rounded border border-gray-300 font-mono text-gray-800 select-all">
                {client.id}
              </code>
              <button
                onClick={handleCopy}
                className="px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client-user@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">User will be invited with the "Client" role and linked to {client.name}.</p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}

          <button
            onClick={handleInvite}
            disabled={saving}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Invitation'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}