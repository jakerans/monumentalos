import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';

export default function ClientViewNav({ user, clientName }) {
  const navigate = useNavigate();

  const backPage = user?.app_role === 'marketing_manager' ? 'MMDashboard' : 'AdminDashboard';
  const backLabel = user?.app_role === 'marketing_manager' ? 'MM Dashboard' : 'Admin Dashboard';

  return (
    <nav className="bg-slate-900 shadow-lg sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl(backPage)}
              className="text-sm hover:opacity-80 inline-flex items-center gap-1" style={{color:'#D6FF03'}}
            >
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <span className="text-slate-600">|</span>
            <h1 className="text-base font-bold text-white truncate">{clientName || 'Client'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{user?.full_name}</span>
            <button onClick={() => base44.auth.logout()} className="text-xs text-slate-500 hover:text-white transition-colors">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}