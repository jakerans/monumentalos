import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, Sparkles, Loader2, Undo2, Plus, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ExpenseToolbar({ onRefresh, onAddExpense, uncategorizedCount, showDistributions, onToggleDistributions }) {
  const [syncing, setSyncing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSync = async () => {
    setSyncing(true);
    const res = await base44.functions.invoke('syncExpensesSheet', {});
    const d = res.data;
    toast({
      title: 'Sync Complete',
      description: `Added ${d.added || 0} · Updated ${d.updated || 0} · Skipped ${d.skipped || 0} · ${d.totalProcessed || 0} rows processed`,
      variant: 'success',
    });
    setSyncing(false);
    if (onRefresh) onRefresh();
  };

  const handleCategorize = async () => {
    setCategorizing(true);
    const res = await base44.functions.invoke('batchCategorizeExpenses', {});
    const d = res.data;
    if (d.processed === 0 && d.updated === 0) {
      toast({ title: 'Nothing to Categorize', description: d.message || 'All expenses already have AI suggestions.', variant: 'default' });
    } else {
      toast({
        title: 'AI Categorization Complete',
        description: `${d.updated || 0} expenses categorized · ${d.skipped_invalid || 0} skipped`,
        variant: 'success',
      });
    }
    setCategorizing(false);
    if (onRefresh) onRefresh();
  };

  const handleUndo = async () => {
    setShowUndoConfirm(false);
    setUndoing(true);
    const res = await base44.functions.invoke('undoAICategorize', {});
    const d = res.data;
    if (d.reverted === 0) {
      toast({ title: 'Nothing to Undo', description: d.message || 'No AI suggestions found.', variant: 'default' });
    } else {
      toast({ title: 'AI Categorization Undone', description: `Reverted ${d.reverted} expenses`, variant: 'success' });
    }
    setUndoing(false);
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary: Sync */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {syncing ? 'Syncing...' : 'Sync from Sheet'}
        </button>

        {/* Secondary: AI Categorize — only when uncategorized exist */}
        {uncategorizedCount > 0 && (
          <button
            onClick={handleCategorize}
            disabled={categorizing}
            className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {categorizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {categorizing ? 'Categorizing...' : 'AI Categorize'}
          </button>
        )}

        {/* Tertiary: Add Expense */}
        <button
          onClick={onAddExpense}
          className="px-3 py-1.5 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Expense
        </button>

        {/* Overflow menu */}
        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[200px]">
              {/* Undo AI — destructive */}
              <button
                onClick={() => { setMenuOpen(false); setShowUndoConfirm(true); }}
                disabled={undoing}
                className="w-full text-left px-3 py-2 text-xs text-orange-400 hover:bg-orange-500/10 flex items-center gap-2 disabled:opacity-50"
              >
                {undoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                Undo AI Categorization
              </button>

              <div className="border-t border-slate-700/50 my-1" />

              {/* Toggle Distributions */}
              <button
                onClick={() => { setMenuOpen(false); if (onToggleDistributions) onToggleDistributions(); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2"
              >
                {showDistributions ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showDistributions ? 'Hide Distributions' : 'Show Distributions'}
              </button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo AI Categorization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all AI-suggested categories and types from every expense. Any approved suggestions will also be reset. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUndo} className="bg-orange-600 hover:bg-orange-700">Yes, Undo All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}