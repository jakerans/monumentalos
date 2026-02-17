import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';

export default function AccountPending() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Account Is Being Set Up</h1>
            <p className="text-sm text-gray-500 mt-2">
              Welcome{user?.full_name ? `, ${user.full_name}` : ''}! Your account is currently being configured by our team. We'll notify you as soon as everything is ready.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <p className="text-xs text-blue-700">
              You'll receive an email when your account is live. No further action is needed from you right now.
            </p>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}