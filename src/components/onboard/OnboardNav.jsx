import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ClipboardList, LogOut } from 'lucide-react';

export default function OnboardNav({ user, activeTab, onTabChange }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-slate-900 shadow-lg sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:h-14">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center gap-2 sm:gap-3">
              <ClipboardList className="w-5 h-5" style={{color:'#D6FF03'}} />
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">Monumental<span style={{color:'#D6FF03'}}>OS</span></h1>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              {user?.app_role === 'admin' && (
                <button
                  onClick={() => navigate(createPageUrl('AdminDashboard'))}
                  className="px-2 py-1 text-xs border border-slate-700 text-slate-300 rounded-md hover:bg-white/5"
                >
                  Admin
                </button>
              )}
              <button onClick={() => base44.auth.logout()} className="text-xs text-slate-400 hover:text-white">Logout</button>
            </div>
          </div>
          <div className="flex items-center justify-between pb-2 sm:pb-0 gap-2">
            <div className="flex items-center gap-1">
              {['projects', 'clients', 'templates'].map(t => (
                <button
                  key={t}
                  onClick={() => onTabChange(t)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === t
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t === 'projects' ? 'Projects' : t === 'clients' ? 'Clients' : 'Templates'}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-3">
              {user?.app_role === 'admin' && (
                <button
                  onClick={() => navigate(createPageUrl('AdminDashboard'))}
                  className="px-2 py-1 text-xs border border-slate-700 text-slate-300 rounded-md hover:bg-white/5"
                >
                  Admin
                </button>
              )}
              <span className="text-xs text-slate-400">{user?.full_name}</span>
              <button onClick={() => base44.auth.logout()} className="text-slate-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}