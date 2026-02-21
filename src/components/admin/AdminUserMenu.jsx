import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Settings, LogOut, ChevronDown, RefreshCw, ChevronRight, Eye, Copy, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SYNC_OPTIONS = [
  { key: 'all', label: 'All Sheets' },
  { key: 'clients', label: 'Clients', fn: 'syncClientsSheet' },
  { key: 'leads', label: 'Leads', fn: 'syncLeadsSheet' },
  { key: 'expenses', label: 'Expenses', fn: 'syncExpensesSheet' },
];

export default function AdminUserMenu({ user, collapsed }) {
  const [open, setOpen] = useState(false);
  const [syncSubOpen, setSyncSubOpen] = useState(false);
  const [confirmSync, setConfirmSync] = useState(null); // key of sheet to confirm
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const copyUserId = (e) => {
    e.stopPropagation();
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSyncSubOpen(false);
        setConfirmSync(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSync = async (option) => {
    setSyncing(true);
    setConfirmSync(null);
    try {
      if (option.key === 'all') {
        const fns = SYNC_OPTIONS.filter(o => o.fn);
        const results = await Promise.allSettled(fns.map(o => base44.functions.invoke(o.fn)));
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        toast({ title: 'Sync Complete', description: `${succeeded} synced${failed ? `, ${failed} failed` : ''}`, variant: failed ? 'destructive' : 'success' });
      } else {
        const res = await base44.functions.invoke(option.fn);
        const d = res.data;
        const desc = d.sheetCreated != null
          ? `+${d.sheetCreated} new, ${d.sheetUpdated} updated (sheet) · +${d.dbCreated} new, ${d.dbUpdated} updated (db)`
          : d.bankAccountMatched != null
          ? `+${d.added || 0} new · ${d.updated || 0} updated · ${d.bankAccountMatched} accounts matched · ${d.bankAccountUnmatched} unmatched`
          : 'Sync completed successfully';
        toast({ title: `${option.label} Synced`, description: desc, variant: 'success' });
      }
    } catch (e) {
      toast({ title: 'Sync Failed', description: e.message, variant: 'destructive' });
    }
    setSyncing(false);
    setSyncSubOpen(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-col items-end">
        <button
          onClick={() => { setOpen(!open); setSyncSubOpen(false); setConfirmSync(null); }}
          className={`flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/5 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {!collapsed && <span>{user?.full_name}</span>}
          {!collapsed && <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />}
          {collapsed && <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />}
        </button>
        {!collapsed && user?.id && (
          <div className="flex items-center gap-1 px-2">
            <span className="text-[10px] text-slate-500 font-mono">{user.id.slice(0, 8)}...</span>
            <button
              onClick={copyUserId}
              title="Copy full ID"
              className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors relative"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
          {/* Sync Sheets */}
          <div className="relative">
            <button
              onClick={() => { setSyncSubOpen(!syncSubOpen); setConfirmSync(null); }}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw className={`w-4 h-4 text-slate-400 ${syncing ? 'animate-spin' : ''}`} />
                Sync Sheets
              </span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${syncSubOpen ? 'rotate-90' : ''}`} />
            </button>

            {syncSubOpen && !confirmSync && (
              <div className="bg-slate-750 border-t border-b border-slate-700/50">
                {SYNC_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setConfirmSync(opt.key)}
                    disabled={syncing}
                    className="flex items-center gap-2.5 w-full px-5 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {confirmSync && (
              <div className="bg-slate-900/80 border-t border-b border-slate-700/50 px-4 py-3 space-y-2">
                <p className="text-xs text-slate-300">
                  Sync <span className="font-bold text-white">{SYNC_OPTIONS.find(o => o.key === confirmSync)?.label}</span>?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runSync(SYNC_OPTIONS.find(o => o.key === confirmSync))}
                    disabled={syncing}
                    className="px-3 py-1.5 text-xs font-bold rounded-md text-black disabled:opacity-50"
                    style={{ backgroundColor: '#D6FF03' }}
                  >
                    {syncing ? 'Syncing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmSync(null)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white border border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/50" />
          <Link
            to={createPageUrl('PreviewEffects')}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            Preview Effects
          </Link>
          <Link
            to={createPageUrl('LeadFieldSettings')}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </Link>
          <div className="border-t border-slate-700/50" />
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}