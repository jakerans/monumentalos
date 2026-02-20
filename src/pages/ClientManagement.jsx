import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function ClientManagement() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [billingType, setBillingType] = useState('pay_per_show');
  const [pricePerShow, setPricePerShow] = useState('');
  const [pricePerSet, setPricePerSet] = useState('');
  const [retainerAmount, setRetainerAmount] = useState('');
  const [retainerDueDay, setRetainerDueDay] = useState('1');
  const [hybridBaseRetainer, setHybridBaseRetainer] = useState('');
  const [hybridRetainerDueDay, setHybridRetainerDueDay] = useState('1');
  const [hybridPerformanceType, setHybridPerformanceType] = useState('pay_per_set');
  const [hybridPerformancePricing, setHybridPerformancePricing] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = {
      name,
      billing_type: billingType,
      status: 'active',
    };
    if (billingType === 'pay_per_show') data.price_per_shown_appointment = Number(pricePerShow);
    if (billingType === 'pay_per_set') data.price_per_set_appointment = Number(pricePerSet);
    if (billingType === 'retainer') {
      data.retainer_amount = Number(retainerAmount);
      data.retainer_due_day = Number(retainerDueDay);
    }
    if (billingType === 'hybrid') {
      data.hybrid_base_retainer = Number(hybridBaseRetainer);
      data.hybrid_retainer_due_day = Number(hybridRetainerDueDay);
      data.hybrid_performance_type = hybridPerformanceType;
      data.hybrid_performance_pricing = hybridPerformancePricing.map(row => ({
        industry: row.industry,
        price_per_show: row.price_per_show ? Number(row.price_per_show) : null,
        price_per_set: row.price_per_set ? Number(row.price_per_set) : null,
      }));
    }

    await base44.entities.Client.create(data);
    setIsSubmitting(false);
    navigate(createPageUrl('AdminDashboard'));
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <nav className="bg-slate-900 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Monumental<span style={{color:'#D6FF03'}}>OS</span></h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-slate-800/50 rounded-lg shadow-lg p-8 border border-slate-700/50">
          <h1 className="text-2xl font-bold text-white mb-6">Add New Client</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
                placeholder="ABC Roofing Co."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Billing Type</label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white"
              >
                <option value="pay_per_show">Pay Per Show</option>
                <option value="pay_per_set">Pay Per Set</option>
                <option value="retainer">Retainer (Flat Monthly)</option>
                <option value="hybrid">Hybrid (Retainer + Performance)</option>
              </select>
            </div>

            {billingType === 'pay_per_show' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Price per Shown Appointment ($)</label>
                <input
                  type="number" value={pricePerShow} onChange={(e) => setPricePerShow(e.target.value)}
                  required min="0" step="0.01"
                  className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
                  placeholder="150.00"
                />
              </div>
            )}

            {billingType === 'pay_per_set' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Price per Appointment Set ($)</label>
                <input
                  type="number" value={pricePerSet} onChange={(e) => setPricePerSet(e.target.value)}
                  required min="0" step="0.01"
                  className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
                  placeholder="100.00"
                />
              </div>
            )}

            {billingType === 'retainer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Retainer Amount ($)</label>
                  <input
                    type="number" value={retainerAmount} onChange={(e) => setRetainerAmount(e.target.value)}
                    required min="0" step="0.01"
                    className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
                    placeholder="2000.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Retainer Due Day (of month)</label>
                  <select
                    value={retainerDueDay}
                    onChange={(e) => setRetainerDueDay(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {billingType === 'hybrid' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Base Retainer Amount ($)</label>
                  <input
                    type="number" value={hybridBaseRetainer} onChange={(e) => setHybridBaseRetainer(e.target.value)}
                    required min="0" step="0.01"
                    className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
                    placeholder="1500.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Retainer Due Day (of month)</label>
                  <select
                    value={hybridRetainerDueDay}
                    onChange={(e) => setHybridRetainerDueDay(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Performance Component Type</label>
                  <select
                    value={hybridPerformanceType}
                    onChange={(e) => setHybridPerformanceType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white"
                  >
                    <option value="pay_per_set">Pay Per Set</option>
                    <option value="pay_per_show">Pay Per Show</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Performance Pricing by Industry</label>
                  <div className="space-y-2">
                    {['painting', 'epoxy', 'kitchen_bath', 'reno'].map(industry => (
                      <div key={industry} className="flex gap-2 items-center">
                        <span className="w-24 text-slate-400 text-sm capitalize">{industry.replace(/_/g, ' ')}</span>
                        <input
                          type="number"
                          placeholder={hybridPerformanceType === 'pay_per_set' ? 'Price per set' : 'Price per show'}
                          min="0"
                          step="0.01"
                          onChange={(e) => {
                            const price = e.target.value;
                            const existingRow = hybridPerformancePricing.find(r => r.industry === industry);
                            if (existingRow) {
                              setHybridPerformancePricing(hybridPerformancePricing.map(r =>
                                r.industry === industry ? {
                                  ...r,
                                  [hybridPerformanceType === 'pay_per_set' ? 'price_per_set' : 'price_per_show']: price || null
                                } : r
                              ));
                            } else {
                              setHybridPerformancePricing([...hybridPerformancePricing, {
                                industry,
                                [hybridPerformanceType === 'pay_per_set' ? 'price_per_set' : 'price_per_show']: price || null
                              }]);
                            }
                          }}
                          value={hybridPerformancePricing.find(r => r.industry === industry)?.[hybridPerformanceType === 'pay_per_set' ? 'price_per_set' : 'price_per_show'] || ''}
                          className="flex-1 px-3 py-2 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button type="button" onClick={() => navigate(createPageUrl('AdminDashboard'))}
                className="px-6 py-2 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-6 py-2 text-black rounded-md hover:opacity-90 disabled:opacity-50 font-bold" style={{backgroundColor:'#D6FF03'}}>
                {isSubmitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}