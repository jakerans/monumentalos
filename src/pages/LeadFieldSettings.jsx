import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import LeadFieldOptionsTab from '../components/admin/LeadFieldOptionsTab';
import LeadFieldAITab from '../components/admin/LeadFieldAITab';
import AICoachSettingsTab from '../components/admin/AICoachSettingsTab';
import AIExpenseSettingsTab from '../components/admin/AIExpenseSettingsTab';
import BankAccountsTab from '../components/admin/BankAccountsTab';
import QuickLinkManager from '../components/admin/QuickLinkManager';
import STLBusinessHoursTab from '../components/admin/STLBusinessHoursTab';
import MessengerTemplateTab from '../components/admin/MessengerTemplateTab';
import { Settings, List, Sparkles, MessageSquare, Receipt, Landmark, Link, Moon, Send } from 'lucide-react';

const TABS = [
  { id: 'lead_options', label: 'Lead Field Options', icon: List },
  { id: 'ai_leads', label: 'AI Lead Classify', icon: Sparkles },
  { id: 'ai_coach', label: 'AI Setter Coach', icon: MessageSquare },
  { id: 'ai_expense', label: 'AI Expenses', icon: Receipt },
  { id: 'messenger', label: 'Messenger Template', icon: Send },
  { id: 'bank_accounts', label: 'Bank Accounts', icon: Landmark },
  { id: 'quick_links', label: 'Quick Links', icon: Link },
  { id: 'stl_hours', label: 'STL Hours', icon: Moon },
];

export default function LeadFieldSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('lead_options');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u.app_role !== 'admin') navigate(createPageUrl('AdminDashboard'));
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: leadSettings, isLoading } = useQuery({
    queryKey: ['lead-field-settings'],
    queryFn: async () => {
      const results = await base44.entities.CompanySettings.filter({ key: 'lead_options' });
      return results[0] || null;
    },
    enabled: !!user,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-for-settings'],
    queryFn: () => base44.entities.Client.filter({ status: 'active' }),
    enabled: !!user,
  });

  const saveLeadSettings = async (data) => {
    if (leadSettings?.id) {
      await base44.entities.CompanySettings.update(leadSettings.id, data);
    } else {
      await base44.entities.CompanySettings.create({ key: 'lead_options', ...data });
    }
    queryClient.invalidateQueries({ queryKey: ['lead-field-settings'] });
  };

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading settings..." />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="LeadFieldSettings" clients={clients || []} />

        <main className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit flex-wrap">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    tab === t.id ? 'bg-[#D6FF03] text-black' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'lead_options' && (
            <LeadFieldOptionsTab settings={leadSettings} onSave={saveLeadSettings} />
          )}
          {tab === 'ai_leads' && (
            <LeadFieldAITab settings={leadSettings} onSave={saveLeadSettings} />
          )}
          {tab === 'ai_coach' && (
            <AICoachSettingsTab />
          )}
          {tab === 'ai_expense' && (
            <AIExpenseSettingsTab />
          )}
          {tab === 'messenger' && (
            <MessengerTemplateTab />
          )}
          {tab === 'bank_accounts' && (
            <BankAccountsTab />
          )}
          {tab === 'quick_links' && (
            <QuickLinkManager />
          )}
          {tab === 'stl_hours' && (
            <STLBusinessHoursTab />
          )}
          </main>
        <AdminMobileNav currentPage="LeadFieldSettings" clients={clients || []} user={user} />
      </div>
    </PageErrorBoundary>
  );
}