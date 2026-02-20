import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import IndustryPicker from '../shared/IndustryPicker';
import IndustryPricingEditor from '../shared/IndustryPricingEditor';

export default function EditClientModal({ open, onOpenChange, client, onSaved }) {
  const [name, setName] = useState('');
  const [industries, setIndustries] = useState([]);
  const [billingType, setBillingType] = useState('pay_per_show');
  const [industryPricing, setIndustryPricing] = useState([]);
  const [retainerAmount, setRetainerAmount] = useState('');
  const [retainerDueDay, setRetainerDueDay] = useState('1');
  const [hybridBaseRetainer, setHybridBaseRetainer] = useState('');
  const [hybridRetainerDueDay, setHybridRetainerDueDay] = useState('1');
  const [hybridPerformanceType, setHybridPerformanceType] = useState('pay_per_set');
  const [hybridPerformancePricing, setHybridPerformancePricing] = useState([]);
  const [adAccountId, setAdAccountId] = useState('');
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [bookingLink, setBookingLink] = useState('');
  const [serviceRadius, setServiceRadius] = useState('');
  const [targetZipCodes, setTargetZipCodes] = useState('');
  const [negativeZipCodes, setNegativeZipCodes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('active');
  const [contacts, setContacts] = useState([]);
  const [goalType, setGoalType] = useState('');
  const [goalValue, setGoalValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client && open) {
      setName(client.name || '');
      setIndustries(client.industries || []);
      setBillingType(client.billing_type || 'pay_per_show');
      setIndustryPricing(client.industry_pricing || []);
      setRetainerAmount(client.retainer_amount ?? '');
      setRetainerDueDay(String(client.retainer_due_day || 1));
      setHybridBaseRetainer(client.hybrid_base_retainer ?? '');
      setHybridRetainerDueDay(String(client.hybrid_retainer_due_day || 1));
      setHybridPerformanceType(client.hybrid_performance_type || 'pay_per_set');
      setHybridPerformancePricing(client.hybrid_performance_pricing || []);
      setAdAccountId(client.ad_account_id || '');
      setStripeCustomerId(client.stripe_customer_id || '');
      setBookingLink(client.booking_link || '');
      setServiceRadius(client.service_radius || '');
      setTargetZipCodes(client.target_zip_codes || '');
      setNegativeZipCodes(client.negative_zip_codes || '');
      setStartDate(client.start_date || '');
      setStatus(client.status || 'active');
      setContacts(client.contacts?.length ? client.contacts : [{ name: '', email: '', role: '' }]);
      setGoalType(client.goal_type || '');
      setGoalValue(client.goal_value ?? '');
    }
  }, [client, open]);

  const addContact = () => setContacts([...contacts, { name: '', email: '', role: '' }]);
  const updateContact = (idx, field, value) => {
    const updated = [...contacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setContacts(updated);
  };
  const removeContact = (idx) => setContacts(contacts.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const validContacts = contacts.filter(c => c.name.trim() || c.email.trim());
    const data = {
      name: name.trim(),
      industries,
      billing_type: billingType,
      ad_account_id: adAccountId.trim() || undefined,
      stripe_customer_id: stripeCustomerId.trim() || undefined,
      booking_link: bookingLink.trim() || undefined,
      service_radius: serviceRadius.trim() || undefined,
      target_zip_codes: targetZipCodes.trim() || undefined,
      negative_zip_codes: negativeZipCodes.trim() || undefined,
      status,
      start_date: startDate || undefined,
      contacts: validContacts,
      goal_type: goalType || undefined,
      goal_value: goalValue ? parseFloat(goalValue) : undefined,
    };

    if (billingType === 'pay_per_show' || billingType === 'pay_per_set') {
      data.industry_pricing = industryPricing.map(row => ({
        industry: row.industry,
        price_per_show: row.price_per_show ? parseFloat(row.price_per_show) : null,
        price_per_set: row.price_per_set ? parseFloat(row.price_per_set) : null,
      }));
    }
    if (billingType === 'retainer') {
      data.retainer_amount = parseFloat(retainerAmount) || 0;
      data.retainer_due_day = parseInt(retainerDueDay) || 1;
    }
    if (billingType === 'hybrid') {
      data.hybrid_base_retainer = parseFloat(hybridBaseRetainer) || 0;
      data.hybrid_retainer_due_day = parseInt(hybridRetainerDueDay) || 1;
      data.hybrid_performance_type = hybridPerformanceType;
      data.hybrid_performance_pricing = hybridPerformancePricing.map(row => ({
        industry: row.industry,
        price_per_show: row.price_per_show ? parseFloat(row.price_per_show) : null,
        price_per_set: row.price_per_set ? parseFloat(row.price_per_set) : null,
      }));
    }

    await base44.entities.Client.update(client.id, data);

    // Sync to Google Sheet
    try {
      await base44.functions.invoke('syncClientToSheet', { client_id: client.id });
    } catch (e) {
      console.warn('Sheet sync failed:', e.message);
    }

    setSaving(false);
    toast({ title: 'Client Updated', description: `${name.trim()} saved & synced to sheet.`, variant: 'success' });
    onSaved();
    onOpenChange(false);
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "text-xs font-medium text-gray-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client — {client?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <div className="mt-1"><IndustryPicker selected={industries} onChange={setIndustries} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Billing Type</label>
            <select value={billingType} onChange={e => setBillingType(e.target.value)} className={inputClass}>
              <option value="pay_per_show">Pay Per Show</option>
              <option value="pay_per_set">Pay Per Set</option>
              <option value="retainer">Retainer (Flat Monthly)</option>
              <option value="hybrid">Hybrid (Retainer + Performance)</option>
            </select>
          </div>
          {(billingType === 'pay_per_show' || billingType === 'pay_per_set') && (
            <>
              <IndustryPricingEditor pricing={industryPricing} onChange={setIndustryPricing} billingType={billingType} />
              {(client?.price_per_shown_appointment || client?.price_per_set_appointment) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1.5">Legacy Pricing (read-only)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {client.price_per_shown_appointment != null && (
                      <div>
                        <span className="text-xs text-amber-600">Per Show:</span>
                        <span className="ml-1 font-medium text-amber-900">${client.price_per_shown_appointment}</span>
                      </div>
                    )}
                    {client.price_per_set_appointment != null && (
                      <div>
                        <span className="text-xs text-amber-600">Per Set:</span>
                        <span className="ml-1 font-medium text-amber-900">${client.price_per_set_appointment}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {billingType === 'retainer' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Retainer Amount</label>
                <input type="number" value={retainerAmount} onChange={e => setRetainerAmount(e.target.value)} className={inputClass} placeholder="e.g. 2000" />
              </div>
              <div>
                <label className={labelClass}>Due Day</label>
                <select value={retainerDueDay} onChange={e => setRetainerDueDay(e.target.value)} className={inputClass}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {billingType === 'hybrid' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Base Retainer Amount</label>
                  <input type="number" value={hybridBaseRetainer} onChange={e => setHybridBaseRetainer(e.target.value)} className={inputClass} placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className={labelClass}>Due Day</label>
                  <select value={hybridRetainerDueDay} onChange={e => setHybridRetainerDueDay(e.target.value)} className={inputClass}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Performance Component Type</label>
                <select value={hybridPerformanceType} onChange={e => setHybridPerformanceType(e.target.value)} className={inputClass}>
                  <option value="pay_per_set">Pay Per Set</option>
                  <option value="pay_per_show">Pay Per Show</option>
                </select>
              </div>
              <IndustryPricingEditor pricing={hybridPerformancePricing} onChange={setHybridPerformancePricing} billingType={hybridPerformanceType} />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Ad Account ID</label>
              <input value={adAccountId} onChange={e => setAdAccountId(e.target.value)} className={inputClass} placeholder="act_123456789" />
            </div>
            <div>
              <label className={labelClass}>Stripe Customer ID</label>
              <input value={stripeCustomerId} onChange={e => setStripeCustomerId(e.target.value)} className={inputClass} placeholder="cus_xxxxx" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Booking Link</label>
              <input value={bookingLink} onChange={e => setBookingLink(e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Service Radius</label>
              <input value={serviceRadius} onChange={e => setServiceRadius(e.target.value)} className={inputClass} placeholder="25 miles" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Target Zip Codes</label>
              <input value={targetZipCodes} onChange={e => setTargetZipCodes(e.target.value)} className={inputClass} placeholder="10001, 10002" />
            </div>
            <div>
              <label className={labelClass}>Negative Zip Codes</label>
              <input value={negativeZipCodes} onChange={e => setNegativeZipCodes(e.target.value)} className={inputClass} placeholder="10003, 10004" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Goal Type</label>
              <select value={goalType} onChange={e => setGoalType(e.target.value)} className={inputClass}>
                <option value="">None</option>
                <option value="leads">Leads</option>
                <option value="sets">Sets</option>
                <option value="shows">Shows</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Goal Value</label>
              <input type="number" value={goalValue} onChange={e => setGoalValue(e.target.value)} className={inputClass} placeholder="e.g. 20" />
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Client Contacts</label>
              <button onClick={addContact} className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {contacts.map((c, idx) => (
                <div key={idx} className="bg-gray-50 rounded-md p-2.5 border border-gray-200">
                  <div className="grid grid-cols-2 gap-1.5">
                    <input value={c.name} onChange={e => updateContact(idx, 'name', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Name" />
                    <input value={c.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input value={c.role} onChange={e => updateContact(idx, 'role', e.target.value)} className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Role" />
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
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving & Syncing...' : 'Save & Sync to Sheet'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}