import React from 'react';

export default function MetricCard({ label, value, subtitle, highlight = false, icon: Icon }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${highlight ? 'border-2 border-blue-500' : 'border border-gray-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {Icon && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}