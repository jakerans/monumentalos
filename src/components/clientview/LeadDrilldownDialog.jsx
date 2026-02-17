import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import LeadEditRow from './LeadEditRow';

export default function LeadDrilldownDialog({ open, onOpenChange, title, leads, onLeadUpdated }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.name || '').toLowerCase().includes(q) ||
           (l.email || '').toLowerCase().includes(q) ||
           (l.phone || '').includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-gray-200">
          <DialogTitle className="text-lg">{title} ({leads.length})</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No records found</p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(lead => (
                <LeadEditRow
                  key={lead.id}
                  lead={lead}
                  expanded={expandedId === lead.id}
                  onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  onSave={onLeadUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}