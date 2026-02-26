import React, { useMemo, useState } from 'react';
import { Copy, Trash2, Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SOURCE_LABELS = {
  form: 'Form',
  msg: 'MSG',
  quiz: 'Quiz',
  inbound_call: 'Inbound Call',
  agency: 'Agency',
};

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

function findDuplicates(leads) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < leads.length; i++) {
    if (used.has(leads[i].id)) continue;

    const dupes = [];
    const lead = leads[i];
    const nameNorm = normalize(lead.name);
    const phoneNorm = normalizePhone(lead.phone);
    const emailNorm = normalize(lead.email);

    for (let j = i + 1; j < leads.length; j++) {
      if (used.has(leads[j].id)) continue;
      const other = leads[j];

      // Same client required
      if (lead.client_id !== other.client_id) continue;

      let match = false;

      // Exact phone match (10-digit normalized)
      if (phoneNorm && phoneNorm === normalizePhone(other.phone)) match = true;

      // Exact email match
      if (!match && emailNorm && emailNorm === normalize(other.email)) match = true;

      // Exact name match (same client)
      if (!match && nameNorm && nameNorm === normalize(other.name)) match = true;

      if (match) {
        dupes.push(other);
        used.add(other.id);
      }
    }

    if (dupes.length > 0) {
      used.add(lead.id);
      groups.push([lead, ...dupes]);
    }
  }

  return groups;
}

export default function LeadDuplicateChecker({ leads, clients }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmLead, setConfirmLead] = useState(null);

  const duplicateGroups = useMemo(() => findDuplicates(leads), [leads]);

  const totalDupes = duplicateGroups.reduce((s, g) => s + g.length - 1, 0);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || '-';
  };

  const handleDelete = async (lead) => {
    setDeletingId(lead.id);
    try {
      await base44.entities.Lead.delete(lead.id);
      toast({ title: 'Lead deleted', description: `${lead.name} has been permanently removed.` });
      queryClient.invalidateQueries({ queryKey: ['all-leads-browse'] });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
      setConfirmLead(null);
    }
  };

  if (duplicateGroups.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-orange-400">
              Potential Duplicates Found ({totalDupes} duplicate{totalDupes !== 1 ? 's' : ''} in {duplicateGroups.length} group{duplicateGroups.length !== 1 ? 's' : ''})
            </h2>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
        </button>

        {expanded && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Leads matched by same name, phone, or email within the same client. Review and delete duplicates as needed.
            </p>

            {duplicateGroups.map((group, gi) => (
              <div key={gi} className="rounded-lg border border-slate-700/40 bg-slate-800/40 overflow-hidden">
                <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-semibold text-orange-300">
                      {group.length} matching leads — {getClientName(group[0].client_id)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Match: {group[0].name}
                    {group[0].phone ? ` · ${group[0].phone}` : ''}
                    {group[0].email ? ` · ${group[0].email}` : ''}
                  </p>
                </div>

                <div className="divide-y divide-slate-700/30">
                  {group.map((lead, li) => (
                    <div key={lead.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{lead.name}</span>
                          {li === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-medium">Oldest</span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                            {lead.status}
                          </span>
                          {lead.lead_source && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                              {SOURCE_LABELS[lead.lead_source] || lead.lead_source}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
                          {lead.phone && <span>{lead.phone}</span>}
                          {lead.email && <span>{lead.email}</span>}
                          <span>Created: {formatDate(lead.created_date)}</span>
                          <span className="text-slate-600">ID: {lead.id.slice(-6)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmLead(lead)}
                        disabled={deletingId === lead.id}
                        className="ml-3 p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Delete this lead"
                      >
                        {deletingId === lead.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmLead} onOpenChange={(open) => { if (!open) setConfirmLead(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete duplicate lead?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-slate-300">
            Permanently delete <span className="font-semibold">{confirmLead?.name}</span>? This cannot be undone.
          </p>
          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
            {confirmLead?.phone && <p>Phone: {confirmLead.phone}</p>}
            {confirmLead?.email && <p>Email: {confirmLead.email}</p>}
            <p>Status: {confirmLead?.status}</p>
            <p>Created: {formatDate(confirmLead?.created_date)}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <button
              onClick={() => handleDelete(confirmLead)}
              disabled={deletingId === confirmLead?.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {deletingId === confirmLead?.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
              Delete
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}