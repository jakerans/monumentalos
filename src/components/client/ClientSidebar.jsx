import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Calendar, History, Settings, Menu, X, LogOut, BarChart2 } from 'lucide-react';

const BASE_NAV_ITEMS = [
  { label: 'My Appointments', retainerLabel: 'My Leads', page: 'ClientPortal', icon: Calendar },
  { label: 'Appointment History', page: 'AppointmentHistory', icon: History },
  { label: 'Performance Report', page: 'ClientReport', icon: BarChart2 },
  { label: 'Settings', page: 'ClientSettings', icon: Settings },
];

export default function ClientSidebar({ user, currentPage, isRetainer = false }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Monumental<span style={{ color: '#D6FF03' }}>OS</span>
        </h1>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {BASE_NAV_ITEMS.map(({ label, retainerLabel, page, icon: Icon }) => {
          const displayLabel = isRetainer && retainerLabel ? retainerLabel : label;
          const active = currentPage === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'text-black font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={active ? { backgroundColor: '#D6FF03' } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {displayLabel}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        {user && (
          <div className="px-3 py-2">
            <p className="text-xs text-slate-500 truncate">{user.full_name}</p>
            <p className="text-[10px] text-slate-600 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-slate-900 border-r border-slate-700/50 min-h-screen">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700/50 flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold text-white tracking-tight">
          Monumental<span style={{ color: '#D6FF03' }}>OS</span>
        </h1>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 flex flex-col h-full border-r border-slate-700/50">
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}