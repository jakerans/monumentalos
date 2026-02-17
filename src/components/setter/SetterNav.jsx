import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function SetterNav({ user }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-slate-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Monumental<span style={{color:'#D6FF03'}}>OS</span></h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user.app_role === 'admin' && (
              <select
                defaultValue="setter"
                onChange={(e) => {
                  if (e.target.value === 'admin') navigate(createPageUrl('AdminDashboard'));
                  else if (e.target.value === 'client') navigate(createPageUrl('ClientPortal'));
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
              >
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
                <option value="client">Client</option>
              </select>
            )}
            <span className="text-xs sm:text-sm text-slate-400 hidden sm:inline">{user.full_name}</span>
            <button
              onClick={() => base44.auth.logout()}
              className="text-xs sm:text-sm text-slate-500 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}