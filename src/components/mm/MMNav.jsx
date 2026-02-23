import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, LogOut, ClipboardCheck, Zap, ZapOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffectsToggle } from '../shared/useEffectsToggle';
import NotificationBell from '../shared/NotificationBell';
import MMTourGuide from './MMTourGuide';

export default function MMNav({ user, clients, pendingOnboardCount = 0 }) {
  const { effectsOn, toggle: toggleEffects } = useEffectsToggle();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-900/80 glass shadow-lg shadow-black/20 sticky top-0 z-30 border-b border-slate-700/50"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="shrink-0"
            >
              <LayoutDashboard className="w-5 h-5" style={{color:'#D6FF03'}} />
            </motion.div>
            <motion.h1
              className="text-sm sm:text-base font-bold text-white tracking-tight shrink-0"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Monumental<span style={{color:'#D6FF03'}}>OS</span>
            </motion.h1>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0"
            >
              <Link
                to={createPageUrl('MMOnboard')}
                data-tour="mm-onboard-link"
                className="relative inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md text-black hover:opacity-90 transition-colors shadow-sm glow-pulse"
                style={{backgroundColor:'#D6FF03'}}
              >
                <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Onboarding</span>
                <span className="sm:hidden">Onboard</span>
                {pendingOnboardCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
                    {pendingOnboardCount}
                  </span>
                )}
              </Link>
            </motion.div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <MMTourGuide />
            <NotificationBell user={user} />
            {user?.app_role === 'admin' && (
              <select
                onChange={(e) => {
                  if (e.target.value === 'admin') navigate(createPageUrl('AdminDashboard'));
                  else if (e.target.value === 'setter') navigate(createPageUrl('SetterDashboard'));
                }}
                defaultValue="mm"
                data-tour="mm-view-switcher"
                className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-md transition-all hover:border-slate-600 max-w-[80px] sm:max-w-none"
              >
                <option value="mm">MM</option>
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
              </select>
            )}
            <button
              onClick={toggleEffects}
              title={effectsOn ? 'Disable animations' : 'Enable animations'}
              className={`p-1.5 rounded-md transition-colors ${
                effectsOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              {effectsOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">{user?.full_name}</span>
            <motion.button
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => base44.auth.logout()}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}