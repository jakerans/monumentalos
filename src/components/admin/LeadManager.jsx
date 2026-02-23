import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle, Loader2, Search } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeadManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch deletion requests
  const { data: deletionRequests = [], isLoading: loadingDeletions } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ deletion_requested: true }, '-deletion_requested_date', 500);
      return leads || [];
    },
    staleTime: 30 * 1000,
  });

  // Fetch all leads for search/browse
  const { data: allLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['all-leads-browse'],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({}, '-created_date', 200);
      return leads || [];
    },
    staleTime: 30 * 1000,
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-leads'],
    queryFn: async () => {
      const c = await base44.entities.Client.list();
      return c || [];
    },
    staleTime: 60 * 1000,
  });

  // Fetch users for displaying names
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-leads'],
    queryFn: async () => {
      const u = await base44.entities.User.list();
      return u || [];
    },
    staleTime: 60 * 1000,
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || '-';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || '-';
  };

  const handleApproveDeletion = async (lead) => {
    setDeletingId(lead.id);
    try {
      await base44.entities.Lead.delete(lead.id);
      toast({ title: 'Lead deleted', description: `${lead.name} has been permanently deleted.` });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-leads-browse'] });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDenyDeletion = async (lead) => {
    setDeletingId(lead.id);
    try {
      await base44.entities.Lead.update(lead.id, {
        deletion_requested: false,
        deletion_reason: '',
        deletion_requested_by: '',
        deletion_requested_date: '',
      });
      toast({ title: 'Request denied', description: 'Deletion request has been cleared.' });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDirectDelete = async (lead) => {
    setDeletingId(lead.id);
    try {
      await base44.entities.Lead.delete(lead.id);
      toast({ title: 'Lead deleted', description: `${lead.name} has been permanently deleted.` });
      queryClient.invalidateQueries({ queryKey: ['all-leads-browse'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setDeletingLead(null);
    }
  };

  // Filter browse results
  let filteredLeads = allLeads;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredLeads = filteredLeads.filter(lead => 
      lead.name?.toLowerCase().includes(term) ||
      lead.phone?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term)
    );
  }
  if (selectedClient !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.client_id === selectedClient);
  }
  if (selectedStatus !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.status === selectedStatus);
  }

  const statuses = [
    { val: 'new', label: 'New' },
    { val: 'first_call_made', label: 'First Call Made' },
    { val: 'contacted', label: 'Contacted' },
    { val: 'appointment_booked', label: 'Appointment Booked' },
    { val: 'disqualified', label: 'Disqualified' },
    { val: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Section A: Pending Deletion Requests */}
      {!loadingDeletions && deletionRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400">
              Pending Deletion Requests ({deletionRequests.length})
            </h2>
          </div>

          <div className="space-y-2">
            {deletionRequests.map(lead => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-4 py-3 rounded-lg border border-slate-700/40 bg-slate-800/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{lead.name}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.email && <span>{lead.email}</span>}
                    <span className="text-slate-500">Client: {getClientName(lead.client_id)}</span>
                    <span className="text-slate-500">Status: {lead.status}</span>
                  </div>
                  {lead.deletion_reason && (
                    <p className="text-xs text-amber-300 mt-2">Reason: {lead.deletion_reason}</p>
                  )}
                  <div className="flex gap-2 text-xs text-slate-500 mt-2">
                    {lead.deletion_requested_by && (
                      <span>Requested by: {getUserName(lead.deletion_requested_by)}</span>
                    )}
                    {lead.deletion_requested_date && (
                      <span>({formatDate(lead.deletion_requested_date)})</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApproveDeletion(lead)}
                    disabled={deletingId === lead.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                  >
                    {deletingId === lead.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                    Approve & Delete
                  </button>
                  <button
                    onClick={() => handleDenyDeletion(lead)}
                    disabled={deletingId === lead.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section B: Lead Search & Browse */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Search & Browse Leads</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
              />
            </div>

            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50"
            >
              <option value="all">All Status</option>
              {statuses.map(s => (
                <option key={s.val} value={s.val}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Table */}
        {loadingLeads ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">
              {searchTerm || selectedClient !== 'all' || selectedStatus !== 'all'
                ? 'No leads match your filters.'
                : 'No leads found.'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700/50 bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Client</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Created</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-slate-300">{getClientName(lead.client_id)}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className="text-[11px] px-2 py-1 rounded-full bg-slate-700/50 text-slate-300">
                        {statuses.find(s => s.val === lead.status)?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{lead.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(lead.created_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setDeletingLead(lead);
                          setShowDeleteConfirm(true);
                        }}
                        disabled={deletingId === lead.id}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === lead.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredLeads.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            Showing {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Permanently delete lead?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-slate-300">
            Permanently delete <span className="font-semibold">{deletingLead?.name}</span>? This cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <button
              onClick={() => handleDirectDelete(deletingLead)}
              disabled={deletingId === deletingLead?.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {deletingId === deletingLead?.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
              Delete
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}