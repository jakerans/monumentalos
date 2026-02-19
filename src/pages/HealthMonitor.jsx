import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '../components/admin/AdminNav';
import { Activity, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

const ENDPOINTS = [
  { name: 'healthCheck', label: 'Health Check' },
];

export default function HealthMonitor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.app_role !== 'admin') navigate(createPageUrl('AdminDashboard'));
    };
    checkAuth();
  }, [navigate]);

  const runChecks = async () => {
    setRunning(true);
    const checks = [];

    for (const ep of ENDPOINTS) {
      const start = performance.now();
      let status = 'ok';
      let statusCode = 200;
      try {
        const res = await base44.functions.invoke(ep.name, {});
        statusCode = res.status;
        if (statusCode !== 200) status = 'error';
      } catch {
        status = 'error';
        statusCode = 500;
      }
      const duration = Math.round(performance.now() - start);
      checks.push({ ...ep, status, statusCode, duration });
    }

    setResults(checks);
    setLastRun(new Date());
    setRunning(false);
  };

  useEffect(() => {
    if (user) runChecks();
  }, [user]);

  if (!user) return null;

  const allHealthy = results.length > 0 && results.every(r => r.status === 'ok');

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav user={user} currentPage="HealthMonitor" clients={[]} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[#D6FF03]" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Health Monitor</h1>
              {lastRun && (
                <p className="text-xs text-slate-400">
                  Last check: {lastRun.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={runChecks}
            disabled={running}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-lg text-black disabled:opacity-50 self-start sm:self-auto"
            style={{ backgroundColor: '#D6FF03' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Checking...' : 'Run Checks'}
          </button>
        </div>

        {/* Overall status */}
        {results.length > 0 && (
          <div className={`rounded-lg border p-4 mb-6 flex items-center gap-3 ${
            allHealthy
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {allHealthy
              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
              : <XCircle className="w-5 h-5 text-red-400" />
            }
            <span className={`text-sm font-medium ${allHealthy ? 'text-emerald-300' : 'text-red-300'}`}>
              {allHealthy ? 'All systems operational' : 'Some endpoints are down'}
            </span>
          </div>
        )}

        {/* Endpoint results */}
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {r.status === 'ok'
                  ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                  : <XCircle className="w-4 h-4 text-red-400" />
                }
                <div>
                  <p className="text-sm font-medium text-white">{r.label}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{r.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className={`text-xs font-mono font-medium ${
                    r.duration < 500 ? 'text-emerald-400' : r.duration < 1500 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {r.duration}ms
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  r.statusCode === 200
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {r.statusCode}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}