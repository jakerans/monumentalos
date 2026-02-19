import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, Users, Receipt, Calculator, Headset, UserCog, Menu, X, LogOut, ArrowRightLeft } from 'lucide-react';

const navItems = [
  { key: 'AdminDashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'ClientPerformance', label: 'Clients', icon: Users },
  { key: 'MonthlyBilling', label: 'Billing', icon: Receipt },
  { key: 'RevenueDashboard', label: 'Accounting', icon: Calculator },
];

const moreItems = [
  { key: 'SetterPerformance', label: 'Setters', icon: Headset },
  { key: 'EmployeeManagement', label: 'Employees', icon: UserCog },
  { key: 'UserManagement', label: 'Users', icon: Users },
];

export default function AdminMobileNav({ currentPage, clients = [] }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 glass border-t border-slate-700/50 sm:hidden">
        <div className="flex items-center justify-around h-14">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <Link
                key={item.key}
                to={createPageUrl(item.key)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${
                  active ? 'text-[#D6FF03]' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${
              moreOpen || moreItems.some(i => i.key === currentPage) ? 'text-[#D6FF03]' : 'text-slate-500'
            }`}
          >
            {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* "More" overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-slate-900 border-t border-slate-700/50 rounded-t-xl p-4 space-y-1"
            onClick={e => e.stopPropagation()}
          >
            {moreItems.map(item => {
              const Icon = item.icon;
              const active = currentPage === item.key;
              return (
                <Link
                  key={item.key}
                  to={createPageUrl(item.key)}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active ? 'bg-white/10 text-[#D6FF03]' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            <div className="border-t border-slate-700/50 pt-2 mt-2 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 mb-1">Switch View</p>
              {[
                { label: 'Marketing Manager', val: 'MMDashboard' },
                { label: 'Onboard Admin', val: 'OnboardDashboard' },
                { label: 'Setter', val: 'SetterDashboard' },
              ].map(v => (
                <button
                  key={v.val}
                  onClick={() => { setMoreOpen(false); navigate(createPageUrl(v.val)); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 w-full text-left"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span className="text-xs">{v.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-700/50 pt-2 mt-2">
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

      {/* Spacer for bottom nav */}
      <div className="h-14 sm:hidden" />
    </>
  );
}