import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

export default function EmployeeOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    confirmed_name: '',
    confirmed_email: '',
    confirmed_phone: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();

        if (!currentUser) {
          base44.auth.redirectToLogin(createPageUrl('EmployeeOnboarding'));
          return;
        }

        // Admins skip onboarding
        if (currentUser.app_role === 'admin') {
          navigate(createPageUrl('AdminDashboard'));
          return;
        }

        // Clients redirect to portal
        if (currentUser.app_role === 'client') {
          navigate(createPageUrl('ClientPortal'));
          return;
        }

        setUser(currentUser);
        setFormData({
          confirmed_name: currentUser.full_name || '',
          confirmed_email: currentUser.email || '',
          confirmed_phone: ''
        });
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await base44.functions.invoke('completeEmployeeOnboarding', {
        confirmed_name: formData.confirmed_name,
        confirmed_email: formData.confirmed_email,
        confirmed_phone: formData.confirmed_phone
      });

      toast({
        title: 'Success',
        description: 'You\'re all set! Welcome aboard.'
      });

      // Navigate based on role
      const roleRoutes = {
        'setter': 'SetterDashboard',
        'marketing_manager': 'MMDashboard',
        'finance_admin': 'FinanceAdminDashboard',
        'onboard_admin': 'OnboardDashboard'
      };

      const targetPage = roleRoutes[user.app_role] || 'SetterDashboard';
      navigate(createPageUrl(targetPage));
    } catch (err) {
      console.error('Onboarding error:', err);

      if (err.response?.data?.no_match) {
        setError('We couldn\'t find your employee record. This usually means your manager hasn\'t added you yet. Please contact them.');
      } else {
        setError(err.response?.data?.error || err.message || 'Setup failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#D6FF03] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">
          <span className="text-white">Monumental</span>
          <span className="text-[#D6FF03]">OS</span>
        </h1>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-8"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">👋 Welcome to MonumentalOS</h2>
          <p className="text-sm text-slate-400">
            Let's get you set up. Confirm your info below and you'll be ready to go.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
            <input
              type="text"
              name="confirmed_name"
              value={formData.confirmed_name}
              onChange={handleInputChange}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
              placeholder="Your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              name="confirmed_email"
              value={formData.confirmed_email}
              disabled
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone (Optional)</label>
            <input
              type="tel"
              name="confirmed_phone"
              value={formData.confirmed_phone}
              onChange={handleInputChange}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#D6FF03] text-black font-bold rounded-lg px-4 py-2 text-sm hover:bg-[#C5FF00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}