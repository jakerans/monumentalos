import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Send } from 'lucide-react';
import IndustryPicker from '../shared/IndustryPicker';

export default function CreateClientModal({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState('');
  const [industries, setIndustries] = useState([]);
  const [billingType, setBillingType] = useState('pay_per_show');
  const [price, setPrice] = useState('');
  const [pricePerSet, setPricePerSet] = useState('');
  const [retainerAmount, setRetainerAmount] = useState('');
  const [retainerDueDay, setRetainerDueDay] = useState('1');
  const [adAccountId, setAdAccountId] = useState('');
  const [bookingLink, setBookingLink] = useState('');
  const [serviceRadius, setServiceRadius] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
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
    if (!name.trim()) return;
    const hasPricing = 
      (billingType === 'pay_per_show' && price) ||
      (billingType === 'pay_per_set' && pricePerSet) ||
      (billingType === 'retainer' && retainerAmount);
    if (!hasPricing) {
      toast({ title: 'Missing Price', description: 'Please enter the billing amount.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const validContacts = contacts.filter(c => c.email.trim()).map(c => ({ ...c, invited: false }));
    const data = {
      name: name.trim(),
      industries: industries.length > 0 ? industries : undefined,
      billing_type: billingType,
      ad_account_id: adAccountId.trim() || undefined,
      booking_link: bookingLink.trim() || undefined,
      service_radius: serviceRadius.trim() || undefined,
      status: 'active',
      start_date: startDate || undefined,
      contacts: validContacts,
    };
    if (billingType === 'pay_per_show') data.price_per_shown_appointment = parseFloat(price) || 0;
    if (billingType === 'pay_per_set') data.price_per_set_appointment = parseFloat(pricePerSet) || 0;
    if (billingType === 'retainer') {
      data.retainer_amount = parseFloat(retainerAmount) || 0;
      data.retainer_due_day = parseInt(retainerDueDay) || 1;
    }
    const client = await base44.entities.Client.create(data);
    setSaving(false);
    toast({ title: 'Client Created', description: `${name.trim()} has been added.`, variant: 'success' });
    onCreated(client);
    resetForm();
    onOpenChange(false);
  };

  const handleInviteContact = async (idx, clientId) => {
    const contact = contacts[idx];
    if (!contact.email.trim() || !clientId) return;
    setInvitingIdx(idx);
    try {
      await base44.functions.invoke('inviteClientUser', {
        email: contact.email.trim(),
        client_id: clientId,
      });
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
    setIndustries([]);
    setBillingType('pay_per_show');
    setPrice('');
    setPricePerSet('');
    setRetainerAmount('');
    setRetainerDueDay('1');
    setAdAccountId('');
    setBookingLink('');
    setServiceRadius('');
    setStartDate(new Date().toISOString().split('T')[0]);
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
            <label className="text-xs font-medium text-gray-700">Industry</label>
            <div className="mt-1">
              <IndustryPicker selected={industries} onChange={setIndustries} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Billing Type *</label>
            <select value={billingType} onChange={e => setBillingType(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="pay_per_show">Pay Per Show</option>
              <option value="pay_per_set">Pay Per Set</option>
              <option value="retainer">Retainer (Flat Monthly)</option>
            </select>
          </div>
          {billingType === 'pay_per_show' && (
            <div>
              <label className="text-xs font-medium text-gray-700">Price Per Shown Appointment *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 250" />
            </div>
          )}
          {billingType === 'pay_per_set' && (
            <div>
              <label className="text-xs font-medium text-gray-700">Price Per Appointment Set *</label>
              <input type="number" value={pricePerSet} onChange={e => setPricePerSet(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 100" />
            </div>
          )}
          {billingType === 'retainer' && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-700">Monthly Retainer Amount *</label>
                <input type="number" value={retainerAmount} onChange={e => setRetainerAmount(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 2000" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Retainer Due Day</label>
                <select value={retainerDueDay} onChange={e => setRetainerDueDay(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-medium text-gray-700">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Ad Account ID</label>
            <input value={adAccountId} onChange={e => setAdAccountId(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. act_123456789" />
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
            disabled={!name.trim() || saving}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}