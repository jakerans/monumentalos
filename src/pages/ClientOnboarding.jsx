import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    confirmed_name: '',
    confirmed_email: '',
    confirmed_phone: '',
    confirmed_company: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          base44.auth.redirectToLogin();
          return;
        }

        const appRole = currentUser.app_role;

        // Redirect based on role
        if (appRole === 'admin') {
          navigate(createPageUrl('AdminDashboard'));
          return;
        }
        if (appRole === 'setter') {
          navigate(createPageUrl('SetterDashboard'));
          return;
        }
        if (appRole === 'marketing_manager') {
          navigate(createPageUrl('MMDashboard'));
          return;
        }

        // If client already has client_id, redirect to portal
        if (appRole === 'client' && currentUser.client_id) {
          navigate(createPageUrl('ClientPortal'));
          return;
        }

        // Pre-fill form with user data
        setFormData({
          confirmed_name: currentUser.full_name || '',
          confirmed_email: currentUser.email || '',
          confirmed_phone: '',
          confirmed_company: '',
        });

        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await base44.functions.invoke('completeClientOnboarding', {
        confirmed_name: formData.confirmed_name,
        confirmed_email: formData.confirmed_email,
        confirmed_phone: formData.confirmed_phone,
        confirmed_company: formData.confirmed_company,
      });

      if (result.data?.success) {
        toast({ title: "You're all set! Welcome aboard." });
        navigate(createPageUrl('ClientPortal'));
      } else if (result.data?.no_match) {
        setError("We couldn't find your client account. This usually means your account manager hasn't set up your portal access yet. Please contact them.");
      } else if (result.data?.error) {
        setError(result.data.error);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="text-2xl font-bold">
          <span className="text-white">Monumental</span>
          <span className="text-[#D6FF03]">OS</span>
        </div>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">👋 Welcome to MonumentalOS</h1>
        <p className="text-sm text-slate-400 mb-8">
          Thanks for joining! Confirm your info below so we can connect you to your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
            <input
              type="text"
              value={formData.confirmed_name}
              onChange={(e) => setFormData({ ...formData, confirmed_name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
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
              value={formData.confirmed_phone}
              onChange={(e) => setFormData({ ...formData, confirmed_phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Company Name (Optional)</label>
            <input
              type="text"
              value={formData.confirmed_company}
              onChange={(e) => setFormData({ ...formData, confirmed_company: e.target.value })}
              placeholder="Your business name"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#D6FF03] text-black font-bold py-2 rounded-lg hover:bg-[#C5EB00] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}