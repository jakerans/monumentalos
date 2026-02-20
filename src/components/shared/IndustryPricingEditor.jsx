import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { INDUSTRY_LABELS } from './IndustryPicker';

const ALL_INDUSTRIES = ['painting', 'epoxy', 'kitchen_bath', 'reno'];

export default function IndustryPricingEditor({ industries = [], pricing = {}, onChange, billingType }) {
  const priceLabel = billingType === 'pay_per_set' ? 'Per Set' : 'Per Show';

  // Industries that have pricing defined
  const pricedIndustries = Object.keys(pricing).filter(k => ALL_INDUSTRIES.includes(k));
  // Industries in the client's list that don't have pricing yet
  const availableToAdd = industries.filter(ind => !(ind in pricing));

  const updatePrice = (industry, value) => {
    onChange({ ...pricing, [industry]: value === '' ? '' : parseFloat(value) || 0 });
  };

  const addIndustry = (industry) => {
    onChange({ ...pricing, [industry]: '' });
  };

  const removeIndustry = (industry) => {
    const next = { ...pricing };
    delete next[industry];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Industry Pricing ({priceLabel})</label>
      <p className="text-[10px] text-gray-500">Set different prices per industry. Leads will be billed at the price matching their industry.</p>
      
      {pricedIndustries.map(ind => (
        <div key={ind} className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 w-24 truncate">{INDUSTRY_LABELS[ind] || ind}</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={pricing[ind]}
              onChange={e => updatePrice(ind, e.target.value)}
              min="0"
              step="0.01"
              className="w-full pl-6 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          <button type="button" onClick={() => removeIndustry(ind)} className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {availableToAdd.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {availableToAdd.map(ind => (
            <button
              key={ind}
              type="button"
              onClick={() => addIndustry(ind)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
            >
              <Plus className="w-3 h-3" /> {INDUSTRY_LABELS[ind] || ind}
            </button>
          ))}
        </div>
      )}

      {industries.length === 0 && (
        <p className="text-[10px] text-amber-600">Add industries to the client first to set per-industry pricing.</p>
      )}
    </div>
  );
}