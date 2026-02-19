import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap, ZapOff } from 'lucide-react';
import { useEffectsToggle } from '../shared/useEffectsToggle';
import AdminUserMenu from './AdminUserMenu';

export default function AdminNav({ user, currentPage, clients = [] }) {
  const { effectsOn, toggle: toggleEffects } = useEffectsToggle();
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
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="hidden sm:block bg-slate-900/80 glass shadow-lg shadow-black/20 sticky top-0 z-30 border-b border-slate-700/50"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <motion.h1
              className="text-lg font-bold text-white tracking-tight shrink-0"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Monumental<span style={{color:'#D6FF03'}}>OS</span>
            </motion.h1>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide min-w-0" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
              {navItems.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                  className="shrink-0"
                >
                  <Link
                    to={createPageUrl(item.key)}
                    className={`nav-link-animated px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      currentPage === item.key
                        ? 'bg-white/10 text-white font-semibold active'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
              className="px-1 py-0.5 text-[9px] sm:text-[11px] bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#D6FF03] transition-all hover:border-slate-600 max-w-[70px] sm:max-w-[110px]"
            >
              <option value="">View</option>
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
            <button
              onClick={toggleEffects}
              title={effectsOn ? 'Disable animations' : 'Enable animations'}
              className={`p-1.5 rounded-md transition-colors ${
                effectsOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              {effectsOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            </button>
            <AdminUserMenu user={user} />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}