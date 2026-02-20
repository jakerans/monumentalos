import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import IndustryPicker from '../shared/IndustryPicker';
import IndustryPricingEditor from '../shared/IndustryPricingEditor';

export default function ClientBillingEditor({ client, open, onOpenChange, onUpdated }) {
  const [industries, setIndustries] = useState([]);
  const [billingType, setBillingType] = useState('pay_per_show');
  const [industryPricing, setIndustryPricing] = useState([]);
  const [retainerAmount, setRetainerAmount] = useState('');
  const [retainerDueDay, setRetainerDueDay] = useState('1');
  const [hybridBaseRetainer, setHybridBaseRetainer] = useState('');
  const [hybridRetainerDueDay, setHybridRetainerDueDay] = useState('1');
  const [hybridPerformanceType, setHybridPerformanceType] = useState('pay_per_set');
  const [hybridPerformancePricing, setHybridPerformancePricing] = useState([]);
  const [clientStatus, setClientStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setIndustries(client.industries || []);
      setBillingType(client.billing_type || 'pay_per_show');
      setIndustryPricing(client.industry_pricing || []);
      setRetainerAmount(String(client.retainer_amount || ''));
      setRetainerDueDay(String(client.retainer_due_day || 1));
      setHybridBaseRetainer(String(client.hybrid_base_retainer || ''));
      setHybridRetainerDueDay(String(client.hybrid_retainer_due_day || 1));
      setHybridPerformanceType(client.hybrid_performance_type || 'pay_per_set');
      setHybridPerformancePricing(client.hybrid_performance_pricing || []);
      setClientStatus(client.status || 'active');
    }
  }, [client]);

  const handleSave = async () => {
    setSaving(true);
    const parsedPricing = industryPricing.map(row => ({
      industry: row.industry,
      price_per_show: row.price_per_show ? parseFloat(row.price_per_show) : null,
      price_per_set: row.price_per_set ? parseFloat(row.price_per_set) : null,
    }));
    const updates = {
      billing_type: billingType,
      industries,
      status: clientStatus,
      industry_pricing: parsedPricing,
    };
    if (clientStatus === 'inactive' && client.status !== 'inactive') {
      updates.deactivated_date = new Date().toISOString().split('T')[0];
    }
    if (clientStatus === 'active' && client.status === 'inactive') {
      updates.deactivated_date = null;
    }
    if (billingType === 'retainer') {
      updates.retainer_amount = Number(retainerAmount) || 0;
      updates.retainer_due_day = Number(retainerDueDay) || 1;
    }
    if (billingType === 'hybrid') {
      updates.hybrid_base_retainer = Number(hybridBaseRetainer) || 0;
      updates.hybrid_retainer_due_day = Number(hybridRetainerDueDay) || 1;
      updates.hybrid_performance_type = hybridPerformanceType;
      updates.hybrid_performance_pricing = hybridPerformancePricing.map(row => ({
        industry: row.industry,
        price_per_show: row.price_per_show ? Number(row.price_per_show) : null,
        price_per_set: row.price_per_set ? Number(row.price_per_set) : null,
      }));
    }
    await base44.entities.Client.update(client.id, updates);
    setSaving(false);
    toast({ title: 'Billing Updated', description: `${client.name} settings saved.`, variant: 'success' });
    onUpdated();
    onOpenChange(false);
  };

  if (!client) return null;

  const ordinal = (d) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Billing — {client.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Industry</label>
            <div className="mt-1">
              <IndustryPicker selected={industries} onChange={setIndustries} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Client Status</label>
            <select value={clientStatus} onChange={e => setClientStatus(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Billing Type</label>
            <select value={billingType} onChange={e => setBillingType(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
              <option value="pay_per_show">Pay Per Show</option>
              <option value="pay_per_set">Pay Per Set</option>
              <option value="retainer">Retainer</option>
              <option value="hybrid">Hybrid (Retainer + Performance)</option>
            </select>
          </div>

          {(billingType === 'pay_per_show' || billingType === 'pay_per_set') && (
            <IndustryPricingEditor pricing={industryPricing} onChange={setIndustryPricing} billingType={billingType} />
          )}

          {billingType === 'retainer' && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-700">Monthly Retainer Amount ($)</label>
                <input type="number" value={retainerAmount} onChange={e => setRetainerAmount(e.target.value)} min="0" step="0.01" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="e.g. 2000" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Retainer Due Day</label>
                <select value={retainerDueDay} onChange={e => setRetainerDueDay(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}{ordinal(d)}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {billingType === 'hybrid' && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-700">Base Retainer Amount ($)</label>
                <input type="number" value={hybridBaseRetainer} onChange={e => setHybridBaseRetainer(e.target.value)} min="0" step="0.01" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="e.g. 1500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Retainer Due Day</label>
                <select value={hybridRetainerDueDay} onChange={e => setHybridRetainerDueDay(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}{ordinal(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Performance Component Type</label>
                <select value={hybridPerformanceType} onChange={e => setHybridPerformanceType(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md">
                  <option value="pay_per_set">Pay Per Set</option>
                  <option value="pay_per_show">Pay Per Show</option>
                </select>
              </div>
              <IndustryPricingEditor pricing={hybridPerformancePricing} onChange={setHybridPerformancePricing} billingType={hybridPerformanceType} />
            </>
          )}

          <button onClick={handleSave} disabled={saving} className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}