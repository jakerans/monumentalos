import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, LogOut, ClipboardCheck } from 'lucide-react';

export default function MMNav({ user, clients, pendingOnboardCount = 0 }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-gray-900">Marketing Manager</h1>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{clients?.length || 0} clients</span>
            <Link
              to={createPageUrl('MMOnboard')}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Onboarding
              {pendingOnboardCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
                  {pendingOnboardCount}
                </span>
              )}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <select
                onChange={(e) => {
                  if (e.target.value === 'admin') navigate(createPageUrl('AdminDashboard'));
                  else if (e.target.value === 'setter') navigate(createPageUrl('SetterDashboard'));
                }}
                defaultValue="mm"
                className="px-2 py-1 text-xs border border-gray-300 rounded-md"
              >
                <option value="mm">Marketing Manager</option>
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
              </select>
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