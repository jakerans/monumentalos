import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function LeadManager() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deleteLeadConfirm, setDeleteLeadConfirm] = useState(null);
  const [denyReqConfirm, setDenyReqConfirm] = useState(null);

  // Deletion requests
  const { data: deletionRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const res = await base44.entities.Lead.filter({ deletion_requested: true });
      return res || [];
    },
    staleTime: 30 * 1000,
  });

  // Users for lookup
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listTeamUsers');
      return res.data?.users || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // All leads for search
  const { data: allLeads = [] } = useQuery({
    queryKey: ['search-leads', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const res = await base44.functions.invoke('searchAllLeads', { query: search });
      return res.data?.results || [];
    },
    staleTime: 30 * 1000,
  });

  // Clients for lookup
  const { data: clients = [] } = useQuery({
    queryKey: ['all-clients'],
    queryFn: async () => {
      const res = await base44.entities.Client.list();
      return res || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  const getUserName = (userId) => {
    if (!userId) return '—';
    const u = users.find(x => x.id === userId);
    return u?.full_name || 'Unknown';
  };

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleApproveDeletion = async (leadId, leadName) => {
    try {
      await base44.entities.Lead.delete(leadId);
      toast({ title: 'Lead Deleted', description: `${leadName} has been permanently deleted.`, variant: 'success' });
      refetchRequests();
    } catch (err) {
      toast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleDenyDeletion = async (leadId) => {
    if (!denyReqConfirm) return;
    try {
      await base44.entities.Lead.update(leadId, {
        deletion_requested: false,
        deletion_reason: '',
        deletion_requested_by: '',
        deletion_requested_date: '',
      });
      toast({ title: 'Request Denied', description: 'Deletion request has been cleared.', variant: 'info' });
      setDenyReqConfirm(null);
      refetchRequests();
    } catch (err) {
      toast({ title: 'Update failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleDeleteLead = async (leadId, leadName) => {
    if (!deleteLeadConfirm) return;
    try {
      await base44.entities.Lead.delete(leadId);
      toast({ title: 'Lead Deleted', description: `${leadName} has been permanently deleted.`, variant: 'success' });
      setDeleteLeadConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['search-leads'] });
    } catch (err) {
      toast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Deletion Requests Section */}
      {deletionRequests.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white">Pending Deletion Requests ({deletionRequests.length})</h2>
          </div>
          <div className="space-y-3">
            {deletionRequests.map(lead => (
              <div key={lead.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="text-xs text-slate-400">Lead</p>
                    <p className="text-sm font-medium text-white">{lead.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Client</p>
                    <p className="text-sm text-slate-300">{clientMap[lead.client_id] || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Requested By</p>
                    <p className="text-sm text-slate-300">{getUserName(lead.deletion_requested_by)}</p>
                  </div>
                </div>
                {lead.deletion_reason && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-400">Reason</p>
                    <p className="text-sm text-slate-300">{lead.deletion_reason}</p>
                  </div>
                )}
                {lead.deletion_requested_date && (
                  <p className="text-xs text-slate-500 mb-2">Requested: {new Date(lead.deletion_requested_date).toLocaleString()}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveDeletion(lead.id, lead.name)}
                    className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Approve & Delete
                  </button>
                  <button
                    onClick={() => setDenyReqConfirm(lead.id)}
                    className="flex-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Search & Delete Leads</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-800 text-white placeholder-slate-500"
          />
        </div>

        {searchInput && (
          <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Client</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Phone</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Created</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {allLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 py-3 text-center text-sm text-slate-400">No leads found</td>
                  </tr>
                ) : (
                  allLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="px-3 py-2 text-sm text-white font-medium">{lead.name}</td>
                      <td className="px-3 py-2 text-sm text-slate-300">{clientMap[lead.client_id] || '—'}</td>
                      <td className="px-3 py-2 text-sm text-slate-300 capitalize">{lead.status?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-3 py-2 text-sm text-slate-400">{lead.phone || '—'}</td>
                      <td className="px-3 py-2 text-sm text-slate-400">{new Date(lead.created_date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => setDeleteLeadConfirm(lead.id)}
                          className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Denial Confirmation Dialog */}
      <AlertDialog open={!!denyReqConfirm} onOpenChange={(open) => { if (!open) setDenyReqConfirm(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deny Deletion Request</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure? This will clear the deletion request and return the lead to the pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleDenyDeletion(denyReqConfirm)}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-medium text-sm transition-colors"
            >
              Confirm
            </button>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLeadConfirm} onOpenChange={(open) => { if (!open) setDeleteLeadConfirm(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Permanently Delete Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to permanently delete this lead? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const lead = allLeads.find(l => l.id === deleteLeadConfirm) || deletionRequests.find(l => l.id === deleteLeadConfirm);
                handleDeleteLead(deleteLeadConfirm, lead?.name || 'Lead');
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
            >
              Delete Permanently
            </button>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}