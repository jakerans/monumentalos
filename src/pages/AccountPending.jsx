import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Clock, Loader2, LogOut } from 'lucide-react';

export default function AccountPending() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let currentUser;
      try {
        currentUser = await base44.auth.me();
      } catch {
        base44.auth.redirectToLogin();
        return;
      }

      setUser(currentUser);

      // If user already has an app_role, redirect them
      if (currentUser.app_role) {
        redirectByRole(currentUser.app_role);
        return;
      }

      // Use backend function to find pending invite and apply app_role via service role
      try {
        const res = await base44.functions.invoke('applyPendingRole');
        if (res.data?.applied && res.data?.role) {
          redirectByRole(res.data.role);
          return;
        }
      } catch (e) {
        console.log('applyPendingRole error:', e);
      }

      setChecking(false);
    };
    checkAuth();
  }, []);

  const redirectByRole = (role) => {
    const routes = {
      admin: 'AdminDashboard',
      marketing_manager: 'MMDashboard',
      setter: 'SetterDashboard',
      onboard_admin: 'OnboardDashboard',
      client: 'ClientPortal',
    };
    navigate(createPageUrl(routes[role] || 'AdminDashboard'));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{color:'#D6FF03'}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-tight">
            Monumental<span style={{color:'#D6FF03'}}>OS</span>
          </h1>
          <div className="flex items-center gap-3">
            {user?.full_name && (
              <span className="text-sm text-slate-400 hidden sm:block">{user.full_name}</span>
            )}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{backgroundColor:'rgba(214,255,3,0.1)'}}>
            <Clock className="w-8 h-8" style={{color:'#D6FF03'}} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Your Account Is Being Set Up</h1>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Hold tight — your account is being configured. We'll get you set up shortly. No action needed on your end.
            </p>
          </div>
          <div className="rounded-lg px-4 py-3" style={{backgroundColor:'rgba(214,255,3,0.08)', borderWidth:1, borderColor:'rgba(214,255,3,0.2)'}}>
            <p className="text-xs" style={{color:'#D6FF03'}}>
              You'll receive an email when your account is live.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}