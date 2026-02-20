import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function DeleteClientDialog({ client, open, onOpenChange, onDeleted }) {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && client) {
      setLoading(true);
      setCounts(null);
      base44.functions.invoke('deleteClientWithRecords', {
        clientId: client.id,
        action: 'preview',
      }).then(res => {
        setCounts(res.data);
        setLoading(false);
      });
    }
  }, [open, client]);

  const handleDelete = async (deleteAll) => {
    setDeleting(true);
    const res = await base44.functions.invoke('deleteClientWithRecords', {
      clientId: client.id,
      action: deleteAll ? 'delete_all' : 'delete_client_only',
    });
    setDeleting(false);
    onOpenChange(false);
    toast({
      title: 'Client Deleted',
      description: deleteAll
        ? `${client.name} and ${res.data.deleted - 1} associated records have been deleted.`
        : `${client.name} has been deleted. Associated records were kept.`,
      variant: 'success',
    });
    onDeleted?.();
  };

  const hasRecords = counts && counts.total > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Delete {client?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {loading ? (
              <span className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking associated records...
              </span>
            ) : hasRecords ? (
              <div className="space-y-3 pt-2">
                <p>This client has the following associated records:</p>
                <div className="bg-slate-900/50 rounded-lg p-3 space-y-1.5">
                  {counts.counts.leads > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Leads</span>
                      <span className="text-white font-medium">{counts.counts.leads}</span>
                    </div>
                  )}
                  {counts.counts.expenses > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Expenses</span>
                      <span className="text-white font-medium">{counts.counts.expenses}</span>
                    </div>
                  )}
                  {counts.counts.billings > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Billing Records</span>
                      <span className="text-white font-medium">{counts.counts.billings}</span>
                    </div>
                  )}
                  {counts.counts.spend > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Ad Spend Records</span>
                      <span className="text-white font-medium">{counts.counts.spend}</span>
                    </div>
                  )}
                  {counts.counts.onboard_projects > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Onboard Projects</span>
                      <span className="text-white font-medium">{counts.counts.onboard_projects}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-1.5 flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Total</span>
                    <span className="text-red-400">{counts.total}</span>
                  </div>
                </div>
                <p className="text-xs text-amber-400">Would you like to delete all associated records too?</p>
              </div>
            ) : (
              <p className="pt-2">This client has no associated records. Are you sure you want to delete it?</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!loading && (
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white">
              Cancel
            </AlertDialogCancel>
            {hasRecords && (
              <button
                onClick={() => handleDelete(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium bg-slate-600 text-white rounded-md hover:bg-slate-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Client Only
              </button>
            )}
            <button
              onClick={() => handleDelete(hasRecords)}
              disabled={deleting}
              className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {hasRecords ? 'Delete All Records & Client' : 'Delete Client'}
            </button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}