import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Settings, LogOut, ChevronDown } from 'lucide-react';

export default function AdminUserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/5"
      >
        <span className="hidden sm:inline">{user?.full_name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
          <Link
            to={createPageUrl('LeadFieldSettings')}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </Link>
          <div className="border-t border-slate-700/50" />
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}