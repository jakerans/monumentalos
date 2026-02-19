import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, Sparkles, Loader2, Undo2 } from 'lucide-react';
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

export default function ExpenseToolbar({ onRefresh }) {
  const [syncing, setSyncing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {syncing ? 'Syncing...' : 'Sync Expenses'}
        </button>
        <button
          onClick={handleCategorize}
          disabled={categorizing}
          className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {categorizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {categorizing ? 'Categorizing...' : 'AI Categorize'}
        </button>
        <button
          onClick={() => setShowUndoConfirm(true)}
          disabled={undoing}
          className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {undoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
          {undoing ? 'Undoing...' : 'Undo AI Categorize'}
        </button>
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