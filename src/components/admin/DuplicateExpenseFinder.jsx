import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Copy, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function DuplicateExpenseFinder({ onCleanupDone }) {
  const [phase, setPhase] = useState('idle'); // idle | scanning | scanned | purging | done
  const [scanResult, setScanResult] = useState(null);

  const handleScan = async () => {
    setPhase('scanning');
    setScanResult(null);
    const res = await base44.functions.invoke('purgeDuplicateExpenses', { mode: 'scan' });
    setScanResult(res.data);
    setPhase(res.data.duplicateCount > 0 ? 'scanned' : 'done');
  };

  const handlePurge = async () => {
    if (!scanResult?.duplicateIds?.length) return;
    setPhase('purging');
    const res = await base44.functions.invoke('purgeDuplicateExpenses', { mode: 'purge', ids: scanResult.duplicateIds });
    toast({ title: `Purged ${res.data.deleted} duplicates ($${Math.round(scanResult.duplicateAmount).toLocaleString()})`, variant: 'success' });
    setPhase('done');
    setScanResult({ ...scanResult, deleted: res.data.deleted });
    if (onCleanupDone) onCleanupDone();
  };

  const reset = () => { setPhase('idle'); setScanResult(null); };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Duplicate Cleaner</h3>
        </div>
        {phase === 'idle' && (
          <button onClick={handleScan} className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" /> Scan for Duplicates
          </button>
        )}
        {phase === 'done' && (
          <button onClick={reset} className="px-3 py-1.5 text-xs font-medium bg-slate-600 text-white rounded-md hover:bg-slate-700">
            Reset
          </button>
        )}
      </div>

      {phase === 'scanning' && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          <span className="text-xs text-yellow-300">Scanning all expenses for duplicates...</span>
        </div>
      )}

      {phase === 'scanned' && scanResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="text-xs text-yellow-300">
              Found <strong>{scanResult.duplicateCount}</strong> duplicates worth <strong>${scanResult.duplicateAmount.toLocaleString()}</strong> across {scanResult.totalScanned} expenses.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePurge}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
            >
              Purge {scanResult.duplicateCount} Duplicates
            </button>
            <button onClick={reset} className="px-3 py-1.5 text-xs font-medium bg-slate-600 text-white rounded-md hover:bg-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'purging' && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
          <span className="text-xs text-red-300">Deleting duplicates server-side... This may take a moment.</span>
        </div>
      )}

      {phase === 'done' && scanResult && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">
            {scanResult.deleted > 0
              ? `Done! Removed ${scanResult.deleted} duplicates ($${Math.round(scanResult.duplicateAmount).toLocaleString()}).`
              : `No duplicates found across ${scanResult.totalScanned} expenses.`}
          </span>
        </div>
      )}
    </div>
  );
}