import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const INDUSTRY_OPTIONS = [
  { value: 'painting', label: 'Painting' },
  { value: 'epoxy', label: 'Epoxy' },
  { value: 'kitchen_bath', label: 'Kitchen & Bath' },
  { value: 'reno', label: 'Renovation' },
];

export default function IndustryPricingEditor({ pricing, onChange, billingType }) {
  const priceField = billingType === 'pay_per_set' ? 'price_per_set' : 'price_per_show';
  const priceLabel = billingType === 'pay_per_set' ? 'Price Per Set' : 'Price Per Show';

  const usedIndustries = pricing.map(p => p.industry);
  const availableIndustries = INDUSTRY_OPTIONS.filter(o => !usedIndustries.includes(o.value));

  const addRow = () => {
    if (availableIndustries.length === 0) return;
    onChange([...pricing, { industry: availableIndustries[0].value, [priceField]: '' }]);
  };

  const updateRow = (idx, field, value) => {
    const updated = [...pricing];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const removeRow = (idx) => {
    onChange(pricing.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Industry Pricing *</label>
        {availableIndustries.length > 0 && (
          <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
            <Plus className="w-3 h-3" /> Add Industry
          </button>
        )}
      </div>
      {pricing.length === 0 && (
        <p className="text-xs text-gray-400 italic">No industry pricing set. Click "Add Industry" to begin.</p>
      )}
      {pricing.map((row, idx) => {
        const otherUsed = pricing.filter((_, i) => i !== idx).map(p => p.industry);
        const rowOptions = INDUSTRY_OPTIONS.filter(o => !otherUsed.includes(o.value));
        return (
          <div key={idx} className="flex items-center gap-2">
            <select
              value={row.industry}
              onChange={(e) => updateRow(idx, 'industry', e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rowOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
              <input
                type="number"
                value={row[priceField] ?? ''}
                onChange={(e) => updateRow(idx, priceField, e.target.value)}
                placeholder={priceLabel}
                min="0"
                step="0.01"
                className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="button" onClick={() => removeRow(idx)} className="p-1 text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}