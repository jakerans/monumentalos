import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

function getDefaultWeek() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
}

function fmtCurrency(val) {
  return '$' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtShortDateYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-slate-700/40" />
        ))}
      </div>
      <div className="h-32 rounded-lg bg-slate-700/40" />
    </div>
  );
}

function ProblemCard({ item, onNoteSaved }) {
  const [noteVal, setNoteVal] = useState(item.notes || '');
  const [savedFlash, setSavedFlash] = useState(false);

  const handleBlur = async () => {
    if (noteVal === (item.notes || '')) return;
    await base44.entities.MonthlyBilling.update(item.id, { notes: noteVal });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    if (onNoteSaved) onNoteSaved(item.id, noteVal);
  };

  const statusColor = item.status === 'failed'
    ? 'bg-rose-500/20 text-rose-400'
    : 'bg-red-500/20 text-red-400';

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">{item.clientName}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-red-400">{fmtCurrency(item.amount)}</span>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColor}`}>
            {item.status}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500">Billing month: {item.billing_month}</p>
      <div className="relative">
        <textarea
          value={noteVal}
          onChange={e => setNoteVal(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add action note..."
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs bg-slate-900/60 border border-slate-700/50 rounded-md text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50 resize-none"
        />
        {savedFlash && (
          <span className="absolute top-1.5 right-2 text-[10px] text-emerald-400 font-medium animate-pulse">Saved</span>
        )}
      </div>
    </div>
  );
}

export default function WeeklyBillingReportPanel() {
  const defaults = getDefaultWeek();
  const [weekStart, setWeekStart] = useState(defaults.weekStart);
  const [weekEnd, setWeekEnd] = useState(defaults.weekEnd);
  const [expanded, setExpanded] = useState(true);
  const [triggered, setTriggered] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['weekly-billing-report', weekStart, weekEnd],
    queryFn: async () => {
      const res = await base44.functions.invoke('getWeeklyBillingReport', { weekStart, weekEnd });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: triggered,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const handleLoad = () => {
    if (triggered) {
      queryClient.invalidateQueries({ queryKey: ['weekly-billing-report', weekStart, weekEnd] });
    }
    setTriggered(true);
  };

  const handleNoteSaved = (id, newNote) => {
    // Update local cache
    queryClient.setQueryData(['weekly-billing-report', weekStart, weekEnd], (old) => {
      if (!old) return old;
      return {
        ...old,
        problemList: old.problemList.map(p => p.id === id ? { ...p, notes: newNote } : p),
      };
    });
  };

  const handleCopyReport = () => {
    if (!data) return;
    const ws = fmtShortDate(weekStart);
    const we = fmtShortDateYear(weekEnd);

    let report = `📋 Billing Report — Week of ${ws} – ${we}\n\n`;
    report += `✅ Collected: ${fmtCurrency(data.collectedTotal)}\n`;
    report += `❌ Failed / Overdue: ${fmtCurrency(data.problemTotal)} (${data.problemCount} accounts)\n`;
    report += `💰 Total AR: ${fmtCurrency(data.totalAR)}\n`;

    if (data.problemList && data.problemList.length > 0) {
      report += `\nProblem Accounts:\n`;
      data.problemList.forEach(p => {
        const noteText = p.notes ? p.notes : 'No action note added';
        report += `• ${p.clientName} — ${fmtCurrency(p.amount)} — ${p.status} — ${noteText}\n`;
      });
    } else {
      report += `\n✅ No failed or overdue accounts this week.\n`;
    }

    navigator.clipboard.writeText(report);
    toast({ title: 'Copied to clipboard', description: 'Ready to paste into Slack.' });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4.5 h-4.5 text-slate-400" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">Weekly Billing Report</h3>
            <p className="text-[11px] text-slate-400">Track collections and generate your Monday Slack report</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-700/30 pt-4">
          {/* Week selector */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-900/60 border border-slate-700/50 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Week End</label>
              <input
                type="date"
                value={weekEnd}
                onChange={e => setWeekEnd(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-900/60 border border-slate-700/50 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
              />
            </div>
            <button
              onClick={handleLoad}
              className="px-4 py-1.5 text-sm font-bold rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#D6FF03', color: '#000' }}
            >
              Load Report
            </button>
          </div>

          {/* Content */}
          {!triggered && (
            <p className="text-xs text-slate-500 text-center py-6">Click "Load Report" to fetch billing data for this week.</p>
          )}

          {triggered && isLoading && <LoadingSkeleton />}

          {triggered && isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm font-medium">Failed to load report data. Please try again.</p>
            </div>
          )}

          {triggered && data && !isLoading && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/50 rounded-lg border border-slate-700/40 p-3">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Collected This Week</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{fmtCurrency(data.collectedTotal)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{data.collectedCount} payment{data.collectedCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg border border-slate-700/40 p-3">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Failed / Overdue</p>
                  <p className={`text-xl font-bold mt-1 ${data.problemTotal > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {fmtCurrency(data.problemTotal)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">({data.problemCount} account{data.problemCount !== 1 ? 's' : ''})</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg border border-slate-700/40 p-3">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Total AR (All Time)</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{fmtCurrency(data.totalAR)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">All unpaid billing</p>
                </div>
              </div>

              {/* Problem accounts */}
              {data.problemList && data.problemList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">⚠ Failed & Overdue Accounts</p>
                  {data.problemList.map(item => (
                    <ProblemCard key={item.id} item={item} onNoteSaved={handleNoteSaved} />
                  ))}
                </div>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopyReport}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#D6FF03', color: '#000' }}
              >
                📋 Copy Slack Report to Clipboard
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}