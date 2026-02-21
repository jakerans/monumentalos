import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap, ZapOff, Package } from 'lucide-react';
import { useEffectsToggle } from '../shared/useEffectsToggle';

export default function SetterNav({ user, unopenedCount = 0, onOpenInventory }) {
  const { effectsOn, toggle: toggleEffects } = useEffectsToggle();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-900/80 glass shadow-lg shadow-black/20 border-b border-slate-700/50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <motion.h1
              className="text-lg sm:text-xl font-bold text-white tracking-tight"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Monumental<span style={{color:'#D6FF03'}}>OS</span>
            </motion.h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user.app_role === 'admin' && (
              <select
                defaultValue="setter"
                onChange={(e) => {
                  if (e.target.value === 'admin') navigate(createPageUrl('AdminDashboard'));
                  else if (e.target.value === 'client') navigate(createPageUrl('ClientPortal'));
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D6FF03] transition-all hover:border-slate-600"
              >
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
                <option value="client">Client</option>
              </select>
            )}
            <button
              onClick={onOpenInventory}
              title="Inventory"
              className="relative p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Package className="w-4 h-4" />
              {unopenedCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white ${
                  unopenedCount >= 10 ? 'bg-red-500' : unopenedCount >= 8 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}>
                  {unopenedCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleEffects}
              title={effectsOn ? 'Disable animations' : 'Enable animations'}
              className={`p-1.5 rounded-md transition-colors ${
                effectsOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              {effectsOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs sm:text-sm text-slate-400 hidden sm:inline">{user.full_name}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => base44.auth.logout()}
              className="text-xs sm:text-sm text-slate-500 hover:text-white transition-colors"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}