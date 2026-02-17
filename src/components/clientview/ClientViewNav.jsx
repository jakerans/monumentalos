import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';

export default function ClientViewNav({ user, clientName }) {
  const navigate = useNavigate();

  const backPage = user?.role === 'marketing_manager' ? 'MMDashboard' : 'AdminDashboard';
  const backLabel = user?.role === 'marketing_manager' ? 'MM Dashboard' : 'Admin Dashboard';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl(backPage)}
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-base font-bold text-gray-900 truncate">{clientName || 'Client'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{user?.full_name}</span>
            <button onClick={() => base44.auth.logout()} className="text-xs text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}