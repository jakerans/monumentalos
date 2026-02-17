import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function SetterNav({ user }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Setter Workspace</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user.role === 'admin' && (
              <select
                defaultValue="setter"
                onChange={(e) => {
                  if (e.target.value === 'admin') navigate(createPageUrl('AdminDashboard'));
                  else if (e.target.value === 'client') navigate(createPageUrl('ClientPortal'));
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
                <option value="client">Client</option>
              </select>
            )}
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">{user.full_name}</span>
            <button
              onClick={() => base44.auth.logout()}
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}