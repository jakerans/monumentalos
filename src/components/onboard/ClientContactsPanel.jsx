import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Plus, Trash2, Check, UserPlus } from 'lucide-react';

export default function ClientContactsPanel({ open, onOpenChange, client, onUpdated }) {
  const [contacts, setContacts] = useState(client?.contacts || []);
  const [invitingIdx, setInvitingIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const addContact = () => setContacts([...contacts, { name: '', email: '', role: '', invited: false }]);

  const updateContact = (idx, field, value) => {
    const updated = [...contacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setContacts(updated);
  };

  const removeContact = (idx) => setContacts(contacts.filter((_, i) => i !== idx));

  const saveContacts = async () => {
    setSaving(true);
    await base44.entities.Client.update(client.id, { contacts });
    setSaving(false);
    onUpdated();
  };

  const inviteContact = async (idx) => {
    const contact = contacts[idx];
    if (!contact.email.trim()) return;
    setInvitingIdx(idx);
    try {
      await base44.users.inviteUser(contact.email.trim(), 'client');
      const updated = [...contacts];
      updated[idx] = { ...updated[idx], invited: true };
      setContacts(updated);
      // Persist the invited flag
      await base44.entities.Client.update(client.id, { contacts: updated });
      onUpdated();
    } catch (err) {
      // user may already exist
    }
    setInvitingIdx(null);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            {client.name} — Contacts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-xs text-gray-500">Manage contacts for this client. Invite them to give them access to the client portal.</p>

          <div className="space-y-2">
            {contacts.map((c, idx) => (
              <div key={idx} className={`rounded-md p-2.5 border ${c.invited ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    value={c.name}
                    onChange={e => updateContact(idx, 'name', e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Name"
                  />
                  <input
                    value={c.email}
                    onChange={e => updateContact(idx, 'email', e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Email"
                    disabled={c.invited}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    value={c.role || ''}
                    onChange={e => updateContact(idx, 'role', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Role"
                  />
                  {c.invited ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Invited
                    </span>
                  ) : (
                    <button
                      onClick={() => inviteContact(idx)}
                      disabled={!c.email.trim() || invitingIdx === idx}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      {invitingIdx === idx ? '...' : 'Invite'}
                    </button>
                  )}
                  <button onClick={() => removeContact(idx)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addContact} className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-dashed border-indigo-300 rounded-md hover:bg-indigo-100">
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </button>

          <button
            onClick={saveContacts}
            disabled={saving}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Contacts'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}