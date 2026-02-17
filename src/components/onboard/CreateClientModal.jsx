import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Send } from 'lucide-react';

export default function CreateClientModal({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [bookingLink, setBookingLink] = useState('');
  const [serviceRadius, setServiceRadius] = useState('');
  const [contacts, setContacts] = useState([{ name: '', email: '', role: 'Owner' }]);
  const [saving, setSaving] = useState(false);
  const [invitingIdx, setInvitingIdx] = useState(null);

  const addContact = () => setContacts([...contacts, { name: '', email: '', role: '' }]);

  const updateContact = (idx, field, value) => {
    const updated = [...contacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setContacts(updated);
  };

  const removeContact = (idx) => setContacts(contacts.filter((_, i) => i !== idx));

  const handleCreate = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    const validContacts = contacts.filter(c => c.email.trim()).map(c => ({ ...c, invited: false }));
    const client = await base44.entities.Client.create({
      name: name.trim(),
      price_per_shown_appointment: parseFloat(price),
      booking_link: bookingLink.trim() || undefined,
      service_radius: serviceRadius.trim() || undefined,
      status: 'active',
      contacts: validContacts,
    });
    setSaving(false);
    onCreated(client);
    resetForm();
    onOpenChange(false);
  };

  const handleInviteContact = async (idx, clientId) => {
    const contact = contacts[idx];
    if (!contact.email.trim()) return;
    setInvitingIdx(idx);
    try {
      await base44.users.inviteUser(contact.email.trim(), 'client');
      // Update the contact as invited
      const updated = [...contacts];
      updated[idx] = { ...updated[idx], invited: true };
      setContacts(updated);
    } catch (err) {
      // user might already exist
    }
    setInvitingIdx(null);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setBookingLink('');
    setServiceRadius('');
    setContacts([{ name: '', email: '', role: 'Owner' }]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Client Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Company Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Smith Remodeling" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Price Per Shown Appointment *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 250" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Booking Link</label>
              <input value={bookingLink} onChange={e => setBookingLink(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Service Radius</label>
              <input value={serviceRadius} onChange={e => setServiceRadius(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 25 miles" />
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Client Contacts</label>
              <button onClick={addContact} className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700">
                <Plus className="w-3 h-3" /> Add Contact
              </button>
            </div>
            <div className="space-y-2">
              {contacts.map((c, idx) => (
                <div key={idx} className="bg-gray-50 rounded-md p-2.5 border border-gray-200">
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      value={c.name}
                      onChange={e => updateContact(idx, 'name', e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Contact name"
                    />
                    <input
                      value={c.email}
                      onChange={e => updateContact(idx, 'email', e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Email address"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      value={c.role}
                      onChange={e => updateContact(idx, 'role', e.target.value)}
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Role (e.g. Owner, PM)"
                    />
                    {contacts.length > 1 && (
                      <button onClick={() => removeContact(idx)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || !price || saving}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}