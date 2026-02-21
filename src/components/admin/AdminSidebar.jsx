import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Zap, ZapOff, LayoutDashboard, Users, Receipt, Calculator, Headset, UserCog,
  ChevronLeft, ChevronRight, ChevronDown, BarChart3, Wallet, TrendingUp,
  Settings, Landmark, Gift, DollarSign, Briefcase, Activity, Eye,
} from 'lucide-react';
import { useEffectsToggle } from '../shared/useEffectsToggle';
import AdminUserMenu from './AdminUserMenu';

// --- Admin Navigation Structure ---
const ADMIN_SECTIONS = {
  finance: {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    items: [
      { key: 'FinanceAdminDashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
      { key: 'MonthlyBilling', label: 'Billing', icon: Receipt },
      { key: 'AccountingPL', label: 'P&L', icon: BarChart3 },
      { key: 'AccountingExpenses', label: 'Expenses', icon: Wallet },
      { key: 'AccountingCashFlow', label: 'Cash Flow', icon: TrendingUp },
      { key: 'AccountingClients', label: 'Client Revenue', icon: Users },
      { key: 'ClientProfitability', label: 'Profitability', icon: TrendingUp },
      { key: 'EmployeeManagement', label: 'Payroll', icon: UserCog },
    ],
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    icon: Briefcase,
    items: [
      { key: 'ClientPerformance', label: 'Client Overview', icon: Users },
      { key: 'SetterPerformance', label: 'Setter Management', icon: Headset },
      { key: 'SetterStats', label: 'Setter Reporting', icon: BarChart3 },
      { key: 'LootAdmin', label: 'Loot System', icon: Gift },
    ],
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { key: 'UserManagement', label: 'Users', icon: Users },
      { key: 'BankAccountSettings', label: 'Bank Accounts', icon: Landmark },
      { key: 'LeadFieldSettings', label: 'Settings', icon: Settings },
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
      { key: 'AccountingCashFlow', label: 'Cash Flow', icon: TrendingUp },
      { key: 'AccountingClients', label: 'Client Revenue', icon: Users },
      { key: 'ClientProfitability', label: 'Profitability', icon: TrendingUp },
      { key: 'EmployeeManagement', label: 'Payroll', icon: UserCog },
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

  const isFinanceAdmin = user?.app_role === 'finance_admin';
  const sections = isFinanceAdmin ? FINANCE_ADMIN_SECTIONS : ADMIN_SECTIONS;

  // Track which accordion sections are open
  const [openSections, setOpenSections] = useState(() => {
    const defaultSection = isFinanceAdmin ? 'finance' : findSectionWithPage(currentPage, sections);
    return defaultSection ? { [defaultSection]: true } : {};
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
        {isFinanceAdmin ? (
          // Finance Admin: flat list, no sections
          financeAdminItems.map((item, i) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isGroupActive = hasChildren && item.children.some(c => c.key === currentPage);
            const active = !hasChildren && currentPage === item.key;
            const isExpanded = expandedGroup === item.key;

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.03, duration: 0.25 }}
              >
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isGroupActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <div className="ml-4 pl-3 border-l border-slate-700/40 mt-0.5 space-y-0.5">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const childActive = currentPage === child.key;
                          return (
                            <Link
                              key={child.key}
                              to={createPageUrl(child.key)}
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                childActive
                                  ? 'bg-white/10 text-white'
                                  : 'text-slate-500 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {ChildIcon && <ChildIcon className="w-3.5 h-3.5 shrink-0" />}
                              {!ChildIcon && <Headset className="w-3.5 h-3.5 shrink-0" />}
                              <span>{child.label}</span>
                              {childActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D6FF03' }} />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={createPageUrl(item.key)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {active && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D6FF03' }} />
                    )}
                  </Link>
                )}
              </motion.div>
            );
          })
        ) : (
          // Admin: accordion sections
          Object.entries(SECTIONS).map(([sectionId, section], sectionIdx) => {
            const SectionIcon = section.icon;
            const isSectionOpen = openSections[sectionId];

            return (
              <div key={sectionId}>
                {/* Section header */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className={`w-full flex items-center gap-2 px-3 py-2 mt-${sectionIdx === 0 ? '0' : '3'} text-[10px] uppercase tracking-wider font-semibold text-slate-500 hover:text-slate-400 transition-colors`}
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
                      const Icon = item.icon;
                      const hasChildren = item.children && item.children.length > 0;
                      const isGroupActive = hasChildren && item.children.some(c => c.key === currentPage);
                      const active = !hasChildren && currentPage === item.key;
                      const isExpanded = expandedGroup === item.key;

                      return (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.02 + itemIdx * 0.02, duration: 0.25 }}
                        >
                          {hasChildren ? (
                            <>
                              <button
                                onClick={() => setExpandedGroup(isExpanded ? null : item.key)}
                                title={collapsed ? item.label : undefined}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  isGroupActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                } ${collapsed ? 'justify-center' : ''}`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                {!collapsed && (
                                  <>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                  </>
                                )}
                              </button>
                              {!collapsed && isExpanded && (
                                <div className="ml-4 pl-3 border-l border-slate-700/40 mt-0.5 space-y-0.5">
                                  {item.children.map(child => {
                                    const ChildIcon = child.icon;
                                    const childActive = currentPage === child.key;
                                    return (
                                      <Link
                                        key={child.key}
                                        to={createPageUrl(child.key)}
                                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                          childActive
                                            ? 'bg-white/10 text-white'
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                      >
                                        {ChildIcon && <ChildIcon className="w-3.5 h-3.5 shrink-0" />}
                                        {!ChildIcon && <Headset className="w-3.5 h-3.5 shrink-0" />}
                                        <span>{child.label}</span>
                                        {childActive && (
                                          <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D6FF03' }} />
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          ) : (
                            <Link
                              to={createPageUrl(item.key)}
                              title={collapsed ? item.label : undefined}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                active
                                  ? 'bg-white/10 text-white'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                              } ${collapsed ? 'justify-center' : ''}`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              {!collapsed && <span>{item.label}</span>}
                              {active && !collapsed && (
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
          })
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-700/50 px-2 py-3 space-y-2">
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
          <AdminUserMenu user={user} />
        </div>
      </div>
    </motion.aside>
  );
}