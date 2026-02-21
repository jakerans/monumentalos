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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-8 space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{backgroundColor:'rgba(214,255,3,0.1)'}}>
            <Clock className="w-8 h-8" style={{color:'#D6FF03'}} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Your Account Is Being Set Up</h1>
            <p className="text-sm text-slate-400 mt-2">
              Welcome{user?.full_name ? `, ${user.full_name}` : ''}! Your account is currently being configured by our team. We'll notify you as soon as everything is ready.
            </p>
          </div>
          <div className="rounded-lg px-4 py-3" style={{backgroundColor:'rgba(214,255,3,0.08)', borderWidth:1, borderColor:'rgba(214,255,3,0.2)'}}>
            <p className="text-xs" style={{color:'#D6FF03'}}>
              You'll receive an email when your account is live. No further action is needed from you right now.
            </p>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}