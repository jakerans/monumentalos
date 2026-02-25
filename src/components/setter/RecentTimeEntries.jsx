import React, { useState } from 'react';
import { Clock, Pencil } from 'lucide-react';
import EditTimeEntryModal from './EditTimeEntryModal';

function formatTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function editStatusBadge(editRequests, entryId) {
  if (!editRequests || editRequests.length === 0) return null;
  const req = editRequests.find(r => r.time_entry_id === entryId);
  if (!req) return null;
  if (req.status === 'pending') {
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Edit Pending</span>;
  }
  if (req.status === 'approved') {
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">Edited</span>;
  }
  if (req.status === 'denied') {
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">Edit Denied</span>;
  }
  return null;
}

function RecentTimeEntries({ entries, editRequests, onRefresh }) {
  const [editEntry, setEditEntry] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  if (!entries || entries.length === 0) return null;

  const completedEntries = entries.filter(e => e.status === 'completed' || e.status === 'edited');

  if (completedEntries.length === 0) return null;

  const hasPendingEdit = (entryId) => {
    return editRequests?.some(r => r.time_entry_id === entryId && r.status === 'pending');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-400">Recent Clock Entries</h3>
      </div>
      <div className="space-y-1.5">
        {completedEntries.map(entry => {
          const badge = editStatusBadge(editRequests, entry.id);
          const canEdit = !hasPendingEdit(entry.id);

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-700/40 bg-slate-800/40"
            >
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">{formatDate(entry.clock_in)}</p>
                <p className="text-xs text-slate-400">
                  {formatTime(entry.clock_in)} – {formatTime(entry.clock_out)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-300 font-medium">{entry.total_hours?.toFixed(2) || '—'}h</span>
                {badge || (
                  canEdit && (
                    <button
                      onClick={() => { setEditEntry(entry); setEditOpen(true); }}
                      className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Request edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EditTimeEntryModal
        entry={editEntry}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmitted={onRefresh}
      />
    </div>
  );
}

export default React.memo(RecentTimeEntries);