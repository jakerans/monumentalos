import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, LogOut, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MMNav({ user, clients, pendingOnboardCount = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-900/80 glass shadow-lg shadow-black/20 sticky top-0 z-30 border-b border-slate-700/50"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <LayoutDashboard className="w-5 h-5" style={{color:'#D6FF03'}} />
            </motion.div>
            <motion.h1
              className="text-base font-bold text-white tracking-tight"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Monumental<span style={{color:'#D6FF03'}}>OS</span>
            </motion.h1>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-medium" 
              style={{color:'#D6FF03'}}
            >
              {clients?.length || 0} clients
            </motion.span>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={createPageUrl('MMOnboard')}
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-black hover:opacity-90 transition-colors shadow-sm glow-pulse"
                style={{backgroundColor:'#D6FF03'}}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Onboarding
                {pendingOnboardCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
                    {pendingOnboardCount}
                  </span>
                )}
              </Link>
            </motion.div>
          </div>
          <div className="flex items-center gap-3">
            {user?.app_role === 'admin' && (
              <select
                onChange={(e) => {
                  if (e.target.value === 'admin') navigate(createPageUrl('AdminDashboard'));
                  else if (e.target.value === 'setter') navigate(createPageUrl('SetterDashboard'));
                }}
                defaultValue="mm"
                className="px-2 py-1 text-xs bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-md transition-all hover:border-slate-600"
              >
                <option value="mm">Marketing Manager</option>
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
              </select>
            )}
            <span className="text-xs text-slate-400">{user?.full_name}</span>
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