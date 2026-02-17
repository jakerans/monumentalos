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
    { key: 'EmployeeManagement', label: 'Employees' },
    { key: 'UserManagement', label: 'Users' },
  ];

  return (
    <nav className="bg-slate-900 shadow-lg sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-white tracking-tight">Monumental<span style={{color:'#D6FF03'}}>OS</span></h1>
            <div className="flex gap-1">
              {navItems.map(item => (
                <Link
                  key={item.key}
                  to={createPageUrl(item.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.key
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
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
              className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
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
            <span className="text-xs text-slate-400">{user?.full_name}</span>
            <button
              onClick={() => base44.auth.logout()}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}