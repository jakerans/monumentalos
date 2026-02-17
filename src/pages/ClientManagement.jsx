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
    if (billingType === 'retainer') data.retainer_amount = Number(retainerAmount);

    await base44.entities.Client.create(data);
    setIsSubmitting(false);
    navigate(createPageUrl('AdminDashboard'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">MonumentalOS</h1>
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

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Client</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Roofing Co."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Type</label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pay_per_show">Pay Per Show</option>
                <option value="pay_per_set">Pay Per Set</option>
                <option value="retainer">Retainer (Flat Monthly)</option>
              </select>
            </div>

            {billingType === 'pay_per_show' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Shown Appointment ($)</label>
                <input
                  type="number" value={pricePerShow} onChange={(e) => setPricePerShow(e.target.value)}
                  required min="0" step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="150.00"
                />
              </div>
            )}

            {billingType === 'pay_per_set' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Appointment Set ($)</label>
                <input
                  type="number" value={pricePerSet} onChange={(e) => setPricePerSet(e.target.value)}
                  required min="0" step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100.00"
                />
              </div>
            )}

            {billingType === 'retainer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Retainer Amount ($)</label>
                <input
                  type="number" value={retainerAmount} onChange={(e) => setRetainerAmount(e.target.value)}
                  required min="0" step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2000.00"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button type="button" onClick={() => navigate(createPageUrl('AdminDashboard'))}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}