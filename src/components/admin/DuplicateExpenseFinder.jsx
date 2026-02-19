import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Copy, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

export default function DuplicateExpenseFinder({ onCleanupDone }) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setSelected(new Set());
    const res = await base44.functions.invoke('findDuplicateExpenses', {});
    setResult(res.data);
    // Select all by default
    const allIds = new Set();
    (res.data.duplicateGroups || []).forEach(g => g.duplicateIds.forEach(id => allIds.add(id)));
    setSelected(allIds);
    setLoading(false);
  };

  const toggleGroup = (group) => {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = group.duplicateIds.every(id => next.has(id));
      group.duplicateIds.forEach(id => {
        if (allSelected) next.delete(id); else next.add(id);
      });
      return next;
    });
  };

  const toggleAll = () => {
    if (!result) return;
    const allIds = [];
    result.duplicateGroups.forEach(g => g.duplicateIds.forEach(id => allIds.push(id)));
    setSelected(prev => {
      if (prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    const ids = Array.from(selected);
    // Delete in batches of 50
    let totalDeleted = 0;
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const res = await base44.functions.invoke('deleteDuplicateExpenses', { ids: batch });
      totalDeleted += res.data.deleted || 0;
    }
    toast({ title: `Deleted ${totalDeleted} duplicate expenses`, variant: 'success' });
    setDeleting(false);
    setResult(null);
    if (onCleanupDone) onCleanupDone();
  };

  const duplicateAmount = result
    ? result.duplicateGroups.reduce((s, g) => {
        const selectedCount = g.duplicateIds.filter(id => selected.has(id)).length;
        return s + g.amount * selectedCount;
      }, 0)
    : 0;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Duplicate Finder</h3>
        </div>
        <button
          onClick={handleScan}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
          {loading ? 'Scanning...' : 'Scan for Duplicates'}
        </button>
      </div>

      {result && (
        <>
          {result.duplicateGroups.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">No duplicates found! All {result.totalExpenses} expenses are unique.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-300">
                  Found <strong>{result.totalDuplicateCount}</strong> duplicate expenses across <strong>{result.duplicateGroups.length}</strong> groups
                  (${duplicateAmount.toLocaleString()} selected for removal)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={toggleAll} className="text-[11px] text-slate-400 hover:text-white underline">
                  {selected.size > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting || selected.size === 0}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deleting ? 'Deleting...' : `Delete ${selected.size} Duplicates`}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1.5">
                {result.duplicateGroups.map((g, i) => {
                  const allSelected = g.duplicateIds.every(id => selected.has(id));
                  const someSelected = g.duplicateIds.some(id => selected.has(id));
                  return (
                    <div
                      key={i}
                      onClick={() => toggleGroup(g)}
                      className={`p-2.5 rounded-md border cursor-pointer transition-colors ${
                        allSelected
                          ? 'bg-red-500/10 border-red-500/30'
                          : someSelected
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-slate-700/30 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded accent-red-500 flex-shrink-0"
                          />
                          <span className="text-xs text-white truncate">{g.description || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-[10px] text-slate-400">{dayjs(g.date).format('MMM D')}</span>
                          <span className="text-xs font-bold text-red-400">${g.amount.toLocaleString()}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 rounded">
                            {g.count}x
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500 pl-5">
                        Keeping oldest · {g.duplicateIds.length} extra with same date &amp; description
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}