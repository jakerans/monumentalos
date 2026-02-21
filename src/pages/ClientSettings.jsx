import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Settings, Link2, MapPin, Map, Save, Check } from 'lucide-react';
import ClientSidebar from '../components/client/ClientSidebar';

export default function ClientSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    booking_link: '',
    service_radius: '',
    target_zip_codes: '',
    negative_zip_codes: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'client' && currentUser.app_role !== 'admin') {
          if (currentUser.app_role === 'setter') window.location.href = '/SetterDashboard';
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  const getClientId = () => {
    if (user?.app_role === 'admin') return localStorage.getItem('admin_view_client_id');
    return user?.client_id;
  };

  const clientId = getClientId();

  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0] || null;
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (clientInfo) {
      setForm({
        booking_link: clientInfo.booking_link || '',
        service_radius: clientInfo.service_radius || '',
        target_zip_codes: clientInfo.target_zip_codes || '',
        negative_zip_codes: clientInfo.negative_zip_codes || '',
      });
    }
  }, [clientInfo]);

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    await base44.entities.Client.update(clientId, form);
    queryClient.invalidateQueries({ queryKey: ['client-info', clientId] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <nav className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:h-16">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Monumental<span style={{color:'#D6FF03'}}>OS</span></h1>
              <div className="flex items-center gap-2 sm:hidden">
                {user.app_role === 'admin' && (
                  <button
                    onClick={() => { localStorage.removeItem('admin_view_client_id'); navigate(createPageUrl('AdminDashboard')); }}
                    className="px-2 py-1 text-xs border border-slate-700 text-slate-300 rounded-md hover:bg-white/5"
                  >Admin</button>
                )}
                <button onClick={() => base44.auth.logout()} className="text-xs text-slate-400 hover:text-white">Logout</button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 pb-2 sm:pb-0 overflow-x-auto">
              <Link to={createPageUrl('ClientPortal')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">Appointments</Link>
              <Link to={createPageUrl('AppointmentHistory')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">History</Link>
              <Link to={createPageUrl('ClientReport')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 whitespace-nowrap">Report</Link>
              <Link to={createPageUrl('ClientSettings')} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white/10 text-white whitespace-nowrap">Settings</Link>
              {user.app_role === 'admin' && clientInfo && (
                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">(Viewing: {clientInfo.name})</span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-4">
              {user.app_role === 'admin' && (
                <button onClick={() => { localStorage.removeItem('admin_view_client_id'); navigate(createPageUrl('AdminDashboard')); }} className="px-3 py-1.5 text-sm border border-slate-700 text-slate-300 rounded-md hover:bg-white/5">Back to Admin</button>
              )}
              <span className="text-sm text-slate-400">{user.full_name}</span>
              <button onClick={() => base44.auth.logout()} className="text-sm text-slate-500 hover:text-white transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-slate-300" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Company Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Booking Link */}
          <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Booking Link</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">This URL will be shown to setters as an embedded window when they book appointments.</p>
            <input
              type="url"
              value={form.booking_link}
              onChange={(e) => setForm(f => ({ ...f, booking_link: e.target.value }))}
              placeholder="https://calendly.com/your-link"
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
            />
          </div>

          {/* Service Radius */}
          <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-semibold text-white">Advertising & Setting Radius</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">The radius we target for advertising and setting appointments.</p>
            <input
              type="text"
              value={form.service_radius}
              onChange={(e) => setForm(f => ({ ...f, service_radius: e.target.value }))}
              placeholder="e.g. 25 miles"
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
            />
          </div>

          {/* Target Zip Codes */}
          <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Map className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Target Zip Codes</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">Zip codes we want to target for advertising and setting. Separate with commas.</p>
            <textarea
              value={form.target_zip_codes}
              onChange={(e) => setForm(f => ({ ...f, target_zip_codes: e.target.value }))}
              placeholder="10001, 10002, 10003..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
            />
          </div>

          {/* Negative Zip Codes */}
          <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Map className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Negative Zip Codes</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">Zip codes to exclude — never book or advertise in these areas. Separate with commas.</p>
            <textarea
              value={form.negative_zip_codes}
              onChange={(e) => setForm(f => ({ ...f, negative_zip_codes: e.target.value }))}
              placeholder="90210, 90211..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-900 text-white placeholder-slate-500"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-600 text-white'
                : 'text-black hover:opacity-90 disabled:opacity-50'
            }`}
            style={!saved ? {backgroundColor:'#D6FF03'} : {}}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>
      </main>
    </div>
  );
}