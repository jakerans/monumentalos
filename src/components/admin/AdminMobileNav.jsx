import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard, Users, Receipt, Calculator, Headset, UserCog,
  Menu, X, LogOut, ArrowRightLeft, BarChart3, Wallet,
  Landmark, Gift, Activity, Eye, PieChart, Target, LineChart, Building, Cog, DollarSign, ArrowUpDown,
} from 'lucide-react';

const financeAdminNav = [
  { key: 'FinanceAdminDashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'MonthlyBilling', label: 'Billing', icon: Receipt },
  { key: 'AccountingPL', label: 'P&L', icon: BarChart3 },
  { key: 'AccountingExpenses', label: 'Expenses', icon: Wallet },
  { key: 'AccountingCashFlow', label: 'Cash Flow', icon: ArrowUpDown },
  { key: 'AccountingClients', label: 'Client Revenue', icon: Users },
  { key: 'ClientProfitability', label: 'Profitability', icon: PieChart },
  { key: 'EmployeeManagement', label: 'Payroll', icon: UserCog },
];

const adminSections = [
  {
    label: 'FINANCE',
    items: [
      { key: 'FinanceAdminDashboard', label: 'Finance Home', icon: Calculator },
      { key: 'MonthlyBilling', label: 'Billing', icon: Receipt },
      { key: 'AccountingPL', label: 'P&L', icon: BarChart3 },
      { key: 'AccountingExpenses', label: 'Expenses', icon: Wallet },
      { key: 'AccountingCashFlow', label: 'Cash Flow', icon: ArrowUpDown },
      { key: 'AccountingClients', label: 'Client Revenue', icon: Users },
      { key: 'ClientProfitability', label: 'Profitability', icon: PieChart },
      { key: 'EmployeeManagement', label: 'Payroll', icon: UserCog },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { key: 'ClientPerformance', label: 'Client Overview', icon: Target },
      { key: 'SetterPerformance', label: 'Setter Management', icon: Headset },
      { key: 'SetterStats', label: 'Setter Reporting', icon: LineChart },
      { key: 'LootAdmin', label: 'Loot System', icon: Gift },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { key: 'UserManagement', label: 'Users', icon: Building },
      { key: 'BankAccountSettings', label: 'Bank Accounts', icon: Landmark },
      { key: 'LeadFieldSettings', label: 'Settings', icon: Cog },
      { key: 'HealthMonitor', label: 'Health Monitor', icon: Activity },
      { key: 'PreviewEffects', label: 'Preview Effects', icon: Eye },
    ],
  },
];

const switchViews = [
  { label: 'Finance Admin', val: 'FinanceAdminDashboard' },
  { label: 'Marketing Manager', val: 'MMDashboard' },
  { label: 'Onboard Admin', val: 'OnboardDashboard' },
  { label: 'Setter', val: 'SetterDashboard' },
];

export default function AdminMobileNav({ currentPage, clients = [], user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isFinanceAdmin = user?.app_role === 'finance_admin';

  return (
    <div className="sm:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-50 p-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-slate-300"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute top-0 right-0 bottom-0 w-64 bg-slate-900 border-l border-slate-700/50 p-4 flex flex-col overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-white">
                Monumental<span style={{ color: '#D6FF03' }}>OS</span>
              </span>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1">
               {isFinanceAdmin ? (
                 financeAdminNav.map(item => {
                   const Icon = item.icon;
                   const active = currentPage === item.key;
                   return (
                     <Link
                       key={item.key}
                       to={createPageUrl(item.key)}
                       onClick={() => setOpen(false)}
                       className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                         active ? 'bg-white/10 text-[#D6FF03]' : 'text-slate-300 hover:bg-white/5'
                       }`}
                     >
                       <Icon className="w-4 h-4" />
                       <span className="text-sm font-medium">{item.label}</span>
                     </Link>
                   );
                 })
               ) : (
                 <>
                   {/* Standalone Dashboard Link */}
                   {(() => {
                     const Icon = LayoutDashboard;
                     const active = currentPage === 'AdminDashboard';
                     return (
                       <Link
                         to={createPageUrl('AdminDashboard')}
                         onClick={() => setOpen(false)}
                         className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-3 pb-3 border-b border-slate-700/30 ${
                           active ? 'bg-white/10 text-[#D6FF03]' : 'text-slate-300 hover:bg-white/5'
                         }`}
                       >
                         <Icon className="w-4 h-4" />
                         <span className="text-sm font-medium">Dashboard</span>
                       </Link>
                     );
                   })()}

                   {/* Section Groups */}
                   {adminSections.map(section => (
                     <div key={section.label}>
                       <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 mb-1.5 mt-3">{section.label}</p>
                       {section.items.map(item => {
                         const Icon = item.icon;
                         const active = currentPage === item.key;
                         return (
                           <Link
                             key={item.key}
                             to={createPageUrl(item.key)}
                             onClick={() => setOpen(false)}
                             className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                               active ? 'bg-white/10 text-[#D6FF03]' : 'text-slate-300 hover:bg-white/5'
                             }`}
                           >
                             <Icon className="w-4 h-4" />
                             <span className="text-sm font-medium">{item.label}</span>
                           </Link>
                         );
                       })}
                     </div>
                   ))}
                 </>
               )}

              {/* View Switcher — admin only */}
              {!isFinanceAdmin && (
                <div className="border-t border-slate-700/50 pt-3 mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 mb-2">Switch View</p>
                  {switchViews.map(v => (
                    <button
                      key={v.val}
                      onClick={() => { setOpen(false); navigate(createPageUrl(v.val)); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 w-full text-left"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span className="text-xs">{v.label}</span>
                    </button>
                  ))}
                  {clients.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 mb-1 mt-2">Client Portal</p>
                      {clients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            localStorage.setItem('admin_view_client_id', c.id);
                            setOpen(false);
                            navigate(createPageUrl('ClientPortal'));
                          }}
                          className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-white/5 w-full text-left"
                        >
                          <span className="text-xs">{c.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </nav>

            <div className="border-t border-slate-700/50 pt-3">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}