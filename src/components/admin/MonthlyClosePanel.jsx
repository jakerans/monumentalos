import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Lock, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';

function getCloseTarget() {
  const now = new Date();
  if (now.getDate() <= 5) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(str) {
  if (!str) return '';
  const [y, m] = str.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function formatShortMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
}

function getMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = -6; i <= 0; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value: val, label: formatMonthYear(val) });
  }
  return options;
}

function ChecklistSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-slate-700/60" />
        <div className="w-48 h-4 rounded bg-slate-700/60" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-slate-700/60" />
        <div className="w-56 h-4 rounded bg-slate-700/60" />
      </div>
    </div>
  );
}

export default function MonthlyClosePanel() {
  const [expanded, setExpanded] = useState(true);
  const [targetMonth, setTargetMonth] = useState(getCloseTarget);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [acting, setActing] = useState(false);
  const queryClient = useQueryClient();
  const monthOptions = getMonthOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monthly-close-status', targetMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyCloseStatus', { targetMonth });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const handleToggle = async (action) => {
    setActing(true);
    await base44.functions.invoke('toggleMonthClose', { targetMonth, action });
    setActing(false);
    setConfirmUnlock(false);
    queryClient.invalidateQueries({ queryKey: ['monthly-close-status', targetMonth] });
    if (action === 'close') {
      toast({ title: 'Month locked', description: `Books are closed for ${formatMonthYear(targetMonth)}.` });
    } else {
      toast({ title: 'Month unlocked', description: `${formatMonthYear(targetMonth)} has been reopened.` });
    }
  };

  const uncategorizedCount = data?.uncategorizedCount ?? 0;
  const aiPendingCount = data?.aiPendingCount ?? 0;
  const missingBillingCount = data?.missingBillingCount ?? 0;
  const activeClientCount = data?.activeClientCount ?? 0;
  const isAlreadyClosed = data?.isAlreadyClosed ?? false;
  const closedMonths = data?.closedMonths ?? [];

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-slate-400" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">Monthly Close</h3>
            <p className="text-[11px] text-slate-400">Lock a period when books are final</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4 border-t border-slate-700/30">
          {/* Month selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Closing Period</label>
              <select
                value={targetMonth}
                onChange={e => { setTargetMonth(e.target.value); setConfirmUnlock(false); }}
                className="px-3 py-1.5 text-sm bg-slate-900/60 border border-slate-700/50 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
              >
                {monthOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {!isLoading && (
              isAlreadyClosed
                ? <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 mt-4">✓ Locked</span>
                : <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-600/40 text-slate-400 border border-slate-600/30 mt-4">Unlocked</span>
            )}
          </div>

          {/* Checklist */}
          {isLoading ? (
            <ChecklistSkeleton />
          ) : isError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm font-medium">Failed to load close status. Please try again.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Expenses */}
              <div className="flex items-start gap-3 py-2">
                {uncategorizedCount === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">All expenses categorized</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm text-slate-300">{uncategorizedCount} uncategorized expense{uncategorizedCount !== 1 ? 's' : ''} in this period</span>
                      <Link to={createPageUrl('AccountingExpenses')} className="ml-2 text-xs font-medium hover:underline" style={{ color: '#D6FF03' }}>Fix now →</Link>
                    </div>
                  </>
                )}
              </div>

              {/* AI pending review */}
              <div className="flex items-start gap-3 py-2">
                {aiPendingCount === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">All AI categorizations reviewed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm text-slate-300">{aiPendingCount} AI-categorized expense{aiPendingCount !== 1 ? 's' : ''} need review</span>
                      <Link to={createPageUrl('AccountingExpenses')} className="ml-2 text-xs font-medium hover:underline" style={{ color: '#D6FF03' }}>Review now →</Link>
                    </div>
                  </>
                )}
              </div>

              {/* Billing */}
              <div className="flex items-start gap-3 py-2">
                {missingBillingCount === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">All {activeClientCount} clients have billing records</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm text-slate-300">{missingBillingCount} client{missingBillingCount !== 1 ? 's' : ''} missing billing records</span>
                      <Link to={createPageUrl('MonthlyBilling')} className="ml-2 text-xs font-medium hover:underline" style={{ color: '#D6FF03' }}>Fix now →</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action button */}
          {!isLoading && !isError && (
            isAlreadyClosed ? (
              !confirmUnlock ? (
                <button
                  onClick={() => setConfirmUnlock(true)}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  🔓 Unlock Month
                </button>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-amber-300 font-medium">Are you sure? This will reopen the period.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmUnlock(false)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleToggle('open')}
                      disabled={acting}
                      className="flex-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                    >
                      {acting ? 'Unlocking...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <button
                onClick={() => handleToggle('close')}
                disabled={acting || uncategorizedCount > 0 || aiPendingCount > 0}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#D6FF03', color: '#000' }}
              >
                {acting ? 'Locking...' : `🔒 Lock Month — ${formatMonthYear(targetMonth)}`}
              </button>
            )
          )}

          {/* Closed months history */}
          {closedMonths.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Previously Closed Periods</p>
              <div className="flex flex-wrap gap-1.5">
                {closedMonths.map(m => (
                  <span key={m} className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    {formatShortMonth(m)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}