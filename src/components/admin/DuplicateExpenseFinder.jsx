import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Copy, CheckCircle, Loader2 } from 'lucide-react';

export default function DuplicateExpenseFinder({ onCleanupDone }) {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);

  const handlePurge = async () => {
    if (!window.confirm('This will scan all expenses and delete duplicates (keeping the oldest of each). Continue?')) return;
    setCleaning(true);
    setResult(null);
    const res = await base44.functions.invoke('purgeDuplicateExpenses', {});
    setResult(res.data);
    setCleaning(false);
    if (res.data.deleted > 0) {
      toast({ title: `Purged ${res.data.deleted} duplicates ($${Math.round(res.data.duplicateAmount).toLocaleString()})`, variant: 'success' });
      if (onCleanupDone) onCleanupDone();
    } else {
      toast({ title: 'No duplicates found', variant: 'default' });
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Duplicate Cleaner</h3>
        </div>
        <button
          onClick={handlePurge}
          disabled={cleaning}
          className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1"
        >
          {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
          {cleaning ? 'Cleaning...' : 'Scan & Purge Duplicates'}
        </button>
      </div>

      {cleaning && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          <span className="text-xs text-yellow-300">Scanning expenses and removing duplicates server-side... This may take a moment.</span>
        </div>
      )}

      {result && !cleaning && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">
            {result.deleted > 0
              ? `Done! Removed ${result.deleted} duplicates ($${Math.round(result.duplicateAmount).toLocaleString()}) from ${result.totalScanned} expenses.`
              : `No duplicates found across ${result.totalScanned} expenses.`}
          </span>
        </div>
      )}
    </div>
  );
}