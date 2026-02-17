import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ClipboardList, LogOut } from 'lucide-react';

export default function OnboardNav({ user, activeTab, onTabChange }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h1 className="text-base font-bold text-gray-900">MonumentalOS</h1>
          </div>
          <div className="flex items-center gap-1">
            {['projects', 'clients', 'templates'].map(t => (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === t
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t === 'projects' ? 'Projects' : t === 'clients' ? 'Clients' : 'Templates'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user?.app_role === 'admin' && (
              <button
                onClick={() => navigate(createPageUrl('AdminDashboard'))}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Admin
              </button>
            )}
            <span className="text-xs text-gray-500">{user?.full_name}</span>
            <button onClick={() => base44.auth.logout()} className="text-gray-400 hover:text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}