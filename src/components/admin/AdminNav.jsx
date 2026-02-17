import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function AdminNav({ user, currentPage, clients = [] }) {
  const navigate = useNavigate();

  const navItems = [
    { key: 'AdminDashboard', label: 'Dashboard' },
    { key: 'ClientPerformance', label: 'Clients' },
    { key: 'MonthlyBilling', label: 'Billing' },
    { key: 'RevenueDashboard', label: 'Accounting' },
    { key: 'SetterPerformance', label: 'Setters' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-gray-900">MonumentalOS</h1>
            <div className="flex gap-1">
              {navItems.map(item => (
                <Link
                  key={item.key}
                  to={createPageUrl(item.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.key
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'mm') navigate(createPageUrl('MMDashboard'));
                else if (val === 'onboard') navigate(createPageUrl('OnboardDashboard'));
                else if (val === 'setter') navigate(createPageUrl('SetterDashboard'));
                else if (val.startsWith('client-')) {
                  localStorage.setItem('admin_view_client_id', val.replace('client-', ''));
                  navigate(createPageUrl('ClientPortal'));
                }
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Switch View</option>
              <option value="mm">Marketing Manager</option>
              <option value="onboard">Onboard Admin</option>
              <option value="setter">Setter</option>
              {clients.length > 0 && (
                <optgroup label="Client Portal">
                  {clients.map(c => (
                    <option key={c.id} value={`client-${c.id}`}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <span className="text-xs text-gray-600">{user?.full_name}</span>
            <button
              onClick={() => base44.auth.logout()}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}