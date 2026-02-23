import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Zap, ZapOff, LayoutDashboard, Users, Receipt, Calculator, Headset,
  ChevronLeft, ChevronRight, ChevronDown, BarChart3, Wallet, TrendingUp,
  Settings, Landmark, Gift, DollarSign, Briefcase, Activity, Eye,
  PieChart, Target, LineChart, Building, Cog, ArrowUpDown, Calendar, ClipboardCheck,
} from 'lucide-react';
import { useEffectsToggle } from '../shared/useEffectsToggle';
import NotificationBell from '../shared/NotificationBell';
import AdminUserMenu from './AdminUserMenu';

// --- Admin Navigation Structure ---
const ADMIN_SECTIONS = {
  finance: {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    items: [
      { key: 'FinanceAdminDashboard', label: 'Finance Home', icon: Calculator },
      { key: 'MonthlyBilling', label: 'Billing', icon: Receipt },
      { key: 'AccountingPL', label: 'P&L', icon: BarChart3 },
      { key: 'AccountingExpenses', label: 'Expenses', icon: Wallet },
      { key: 'AccountingCashFlow', label: 'Cash Flow', icon: ArrowUpDown },
      { key: 'AccountingClients', label: 'Client Revenue', icon: Users },
      { key: 'ClientProfitability', label: 'Profitability', icon: PieChart },
      { key: 'EmployeeManagement', label: 'Employees', icon: Users },
    ],
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    icon: Briefcase,
    items: [
      { key: 'ClientPerformance', label: 'Client Overview', icon: Target },
      { key: 'SetterPerformance', label: 'Setter Management', icon: Headset },
      { key: 'SetterStats', label: 'Setter Reporting', icon: LineChart },
      { key: 'LeadManager', label: 'Lead Management', icon: Users },
      { key: 'LootAdmin', label: 'Rewards Admin', icon: Gift },
    ],
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { key: 'UserManagement', label: 'Users', icon: Building },
      { key: 'BankAccountSettings', label: 'Bank Accounts', icon: Landmark },
      { key: 'LeadFieldSettings', label: 'Lead Settings', icon: Cog },
      { key: 'ShiftChecklistSettings', label: 'Shift Checklist', icon: ClipboardCheck },
      { key: 'HealthMonitor', label: 'Health Monitor', icon: Activity },
      { key: 'PreviewEffects', label: 'Preview Effects', icon: Eye },
    ],
  },
};

// --- Finance Admin Navigation Structure ---
const FINANCE_ADMIN_SECTIONS = {
  finance: {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    items: [
      { key: 'MonthlyBilling', label: 'Billing', icon: Receipt },
      { key: 'AccountingPL', label: 'P&L', icon: BarChart3 },
      { key: 'AccountingExpenses', label: 'Expenses', icon: Wallet },
      { key: 'AccountingCashFlow', label: 'Cash Flow', icon: ArrowUpDown },
      { key: 'AccountingClients', label: 'Client Revenue', icon: Users },
      { key: 'ClientProfitability', label: 'Profitability', icon: PieChart },
      { key: 'EmployeeManagement', label: 'Employees', icon: Users },
    ],
  },
};

function findSectionWithPage(currentPage, sectionsObj) {
  for (const section of Object.values(sectionsObj)) {
    if (section.items.some(item => item.key === currentPage)) {
      return section.id;
    }
  }
  return null;
}

export default function AdminSidebar({ user, currentPage, clients = [] }) {
  const { effectsOn, toggle: toggleEffects } = useEffectsToggle();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [deletionCount, setDeletionCount] = useState(0);

  // Fetch deletion request count
  React.useEffect(() => {
    base44.entities.Lead.filter({ deletion_requested: true }, '-deletion_requested_date', 500)
      .then(leads => setDeletionCount(leads?.length || 0));
  }, []);

  const isFinanceAdmin = user?.app_role === 'finance_admin';
  const sections = isFinanceAdmin ? FINANCE_ADMIN_SECTIONS : ADMIN_SECTIONS;

  // Track which accordion sections are open
  const [openSections, setOpenSections] = useState(() => {
    if (isFinanceAdmin) {
      return { finance: true };
    }
    // For admin: find the section containing currentPage, or default to Finance
    const containingSection = findSectionWithPage(currentPage, sections);
    return { [containingSection || 'finance']: true };
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const w = collapsed ? 'w-16' : 'w-52';

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`hidden sm:flex flex-col ${w} h-screen sticky top-0 z-30 bg-slate-900/80 glass border-r border-slate-700/50 transition-all duration-200`}
    >
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 h-14 border-b border-slate-700/50`}>
        {!collapsed && (
          <motion.h1
            className="text-lg font-bold text-white tracking-tight"
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Monumental<span style={{ color: '#D6FF03' }}>OS</span>
          </motion.h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>



      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {/* Standalone Dashboard Link (top) */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-3 pb-3 border-b border-slate-700/30"
          >
            <Link
              to={createPageUrl(isFinanceAdmin ? 'FinanceAdminDashboard' : 'AdminDashboard')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === (isFinanceAdmin ? 'FinanceAdminDashboard' : 'AdminDashboard')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
              {currentPage === (isFinanceAdmin ? 'FinanceAdminDashboard' : 'AdminDashboard') && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D6FF03' }} />
              )}
            </Link>
          </motion.div>
        )}

        {/* Collapsed mode: standalone dashboard icon + all page icons */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1 mb-2">
            <Link
              to={createPageUrl(isFinanceAdmin ? 'FinanceAdminDashboard' : 'AdminDashboard')}
              className={`p-1.5 rounded-md transition-all duration-200 ${
                currentPage === (isFinanceAdmin ? 'FinanceAdminDashboard' : 'AdminDashboard')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Accordion Sections */}
        {Object.entries(sections).map(([sectionId, section], sectionIdx) => {
          const SectionIcon = section.icon;
          const isSectionOpen = openSections[sectionId];

          return (
            <div key={sectionId}>
              {/* Section header (expanded mode only) */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(sectionId)}
                  className="w-full flex items-center gap-2 px-3 py-2 mt-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500 hover:text-slate-400 transition-colors"
                >
                  <SectionIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSectionOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Section items */}
              {isSectionOpen && (
                <div className={collapsed ? '' : 'mt-1.5 space-y-0.5'}>
                  {section.items.map((item, itemIdx) => {
                    // Skip FinanceAdminDashboard when collapsed to avoid duplicate dashboard icon
                    if (collapsed && item.key === 'FinanceAdminDashboard') return null;

                    const Icon = item.icon;
                    const active = currentPage === item.key;

                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 + itemIdx * 0.02, duration: 0.25 }}
                      >
                        {collapsed ? (
                          <Link
                            to={createPageUrl(item.key)}
                            title={item.label}
                            className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-200 ${
                              active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link
                             to={createPageUrl(item.key)}
                             className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                               active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                             }`}
                           >
                             <Icon className="w-4 h-4 shrink-0" />
                             <span className="flex-1">{item.label}</span>
                             {item.key === 'LeadManager' && deletionCount > 0 && (
                               <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full">{deletionCount}</span>
                             )}
                             {active && !deletionCount && (
                               <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D6FF03' }} />
                             )}
                           </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-700/50 px-2 py-3 space-y-2">
        {!collapsed && (
          <NotificationBell user={user} />
        )}
        {/* View Switcher */}
        {!collapsed && (
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'mm') navigate(createPageUrl('MMDashboard'));
              else if (val === 'onboard') navigate(createPageUrl('OnboardDashboard'));
              else if (val === 'setter') navigate(createPageUrl('SetterDashboard'));
              else if (val === 'finance') navigate(createPageUrl('FinanceAdminDashboard'));
              else if (val.startsWith('client-')) {
                localStorage.setItem('admin_view_client_id', val.replace('client-', ''));
                navigate(createPageUrl('ClientPortal'));
              }
            }}
            className="w-full px-2 py-1.5 text-[11px] bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D6FF03] transition-all hover:border-slate-600"
          >
            <option value="">Switch View</option>
            <option value="mm">Marketing Manager</option>
            <option value="onboard">Onboard Admin</option>
            <option value="setter">Setter</option>
            <option value="finance">Finance Admin</option>
            {clients.length > 0 && (
              <optgroup label="Client Portal">
                {clients.map(c => (
                  <option key={c.id} value={`client-${c.id}`}>{c.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        )}

        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <button
            onClick={toggleEffects}
            title={effectsOn ? 'Disable animations' : 'Enable animations'}
            className={`p-1.5 rounded-md transition-colors ${
              effectsOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
          >
            {effectsOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
          </button>
          <AdminUserMenu user={user} collapsed={collapsed} />
        </div>
      </div>
    </motion.aside>
  );
}