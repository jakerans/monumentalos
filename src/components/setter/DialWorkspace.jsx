import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { base44 } from '@/api/base44Client';
import { Phone, Search, X, ArrowLeft, Plus, Database, Loader2, FileText, HelpCircle, MessageSquare, Calendar, Mail, Copy, Check, Clock, User, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const STATUS_COLORS = {
  new: 'bg-blue-500/20 text-blue-400',
  first_call_made: 'bg-amber-500/20 text-amber-400',
  contacted: 'bg-amber-500/20 text-amber-400',
  appointment_booked: 'bg-green-500/20 text-green-400',
  disqualified: 'bg-red-500/20 text-red-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
};

const STATUS_LABELS = {
  new: 'New',
  first_call_made: 'Called',
  contacted: 'Contacted',
  appointment_booked: 'Booked',
  disqualified: 'DQ',
  completed: 'Completed',
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function isClosed(lead) {
  return lead.outcome === 'sold' || lead.outcome === 'lost' || lead.status === 'completed';
}

function getStatusColor(lead) {
  if (lead.outcome === 'sold') return 'bg-emerald-500/20 text-emerald-400';
  if (lead.outcome === 'lost') return 'bg-slate-600/30 text-slate-400';
  return STATUS_COLORS[lead.status] || 'bg-slate-600/30 text-slate-400';
}

function getStatusLabel(lead) {
  if (lead.outcome === 'sold') return 'Sold';
  if (lead.outcome === 'lost') return 'Lost';
  return STATUS_LABELS[lead.status] || lead.status;
}

function LeadRow({ lead, clientName, onClick }) {
  const receivedDate = lead.lead_received_date || lead.created_date;
  const closed = isClosed(lead);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-700/30 last:border-b-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">{lead.name}</span>
          {closed && <span className="text-[10px] text-slate-500">(closed)</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {lead.phone && <span className="text-xs text-slate-400">{lead.phone}</span>}
          {lead.phone && lead.email && <span className="text-slate-600">·</span>}
          {lead.email && <span className="text-xs text-slate-500 truncate">{lead.email}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {clientName && <span className="text-[11px] text-slate-500 hidden sm:block">{clientName}</span>}
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getStatusColor(lead)}`}>
          {getStatusLabel(lead)}
        </span>
        <span className="text-[10px] text-slate-500 w-16 text-right">{relativeTime(receivedDate)}</span>
      </div>
    </button>
  );
}

const MD_PROSE = {
  p: ({ children }) => <p className="text-slate-300 text-base leading-relaxed mb-3">{children}</p>,
  h1: ({ children }) => <h1 className="text-white font-bold text-xl mb-3 mt-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-white font-bold text-lg mb-2 mt-4">{children}</h2>,
  h3: ({ children }) => <h3 className="text-white font-semibold text-base mb-2 mt-3">{children}</h3>,
  h4: ({ children }) => <h4 className="text-slate-200 font-semibold text-sm mb-2 mt-3">{children}</h4>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300">{children}</ol>,
  li: ({ children }) => <li className="text-slate-300 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-slate-200 italic">{children}</em>,
};

const MD_SMALL = {
  ...MD_PROSE,
  p: ({ children }) => <p className="text-slate-400 text-sm leading-relaxed mb-2">{children}</p>,
  h1: ({ children }) => <h1 className="text-white font-bold text-base mb-2 mt-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-white font-semibold text-sm mb-1.5 mt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-slate-200 font-semibold text-sm mb-1.5 mt-2">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-slate-400">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-slate-400">{children}</ol>,
  li: ({ children }) => <li className="text-slate-400 text-sm leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-slate-200 font-semibold">{children}</strong>,
};

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} className={`p-1 rounded text-slate-500 hover:text-slate-300 transition-colors ${className}`}>
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DialWorkspaceInner({ allLeads, clients, user, onClose, onAddLead, addLeadOpen, setAddLeadOpen, onAction }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [deepResults, setDeepResults] = useState(null);
  const [deepClients, setDeepClients] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepQuery, setDeepQuery] = useState(null); // the query that triggered deep search
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef(null);

  // Check viewport size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (!selectedLead && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedLead, isMobile]);

  // Prevent ESC from closing
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') e.stopPropagation();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When query changes after a deep search, clear deep results
  useEffect(() => {
    if (deepQuery && debouncedQuery !== deepQuery) {
      setDeepResults(null);
      setDeepClients(null);
      setDeepQuery(null);
    }
  }, [debouncedQuery, deepQuery]);

  // Build client map for primary results
  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  // Build client map for deep search results
  const deepClientMap = useMemo(() => {
    if (!deepClients) return clientMap;
    const map = {};
    deepClients.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [deepClients, clientMap]);

  // Primary search: filter allLeads in memory
  const primaryResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    const matched = [];
    for (const lead of allLeads) {
      if (matched.length >= 10) break;
      const nameMatch = lead.name && lead.name.toLowerCase().includes(q);
      const phoneMatch = lead.phone && lead.phone.toLowerCase().includes(q);
      const emailMatch = lead.email && lead.email.toLowerCase().includes(q);
      if (nameMatch || phoneMatch || emailMatch) matched.push(lead);
    }
    return matched;
  }, [allLeads, debouncedQuery]);

  // Are we showing deep results?
  const showingDeep = deepResults !== null && debouncedQuery === deepQuery;
  const displayResults = showingDeep ? deepResults : primaryResults;
  const displayClientMap = showingDeep ? deepClientMap : clientMap;

  const showDeepSearchButton = !showingDeep && debouncedQuery.length >= 3 && primaryResults.length < 3;

  const handleDeepSearch = useCallback(async () => {
    if (debouncedQuery.length < 3) return;
    setDeepLoading(true);
    try {
      const res = await base44.functions.invoke('searchAllLeads', { query: debouncedQuery });
      setDeepResults(res.data.results || []);
      setDeepClients(res.data.clients || null);
      setDeepQuery(debouncedQuery);
    } catch {
      setDeepResults([]);
      setDeepQuery(debouncedQuery);
    } finally {
      setDeepLoading(false);
    }
  }, [debouncedQuery]);

  const [sop, setSop] = useState(null);
  const [sopLoading, setSopLoading] = useState(false);
  const notesRef = useRef(null);
  const [notesSaving, setNotesSaving] = useState(false);

  // Refresh selectedLead from allLeads when allLeads updates (after modal actions)
  useEffect(() => {
    if (selectedLead) {
      const updated = allLeads.find(l => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  }, [allLeads]);

  // Fetch SOP when lead is selected
  useEffect(() => {
    if (!selectedLead) { setSop(null); return; }
    setSop(null);
    setSopLoading(true);
    base44.functions.invoke('manageClientSOP', { action: 'get', client_id: selectedLead.client_id })
      .then(res => setSop(res.data?.sop || null))
      .catch(() => setSop(null))
      .finally(() => setSopLoading(false));
  }, [selectedLead?.id, selectedLead?.client_id]);

  const handleSaveNotes = useCallback(async () => {
    if (!selectedLead || !notesRef.current) return;
    setNotesSaving(true);
    try {
      await base44.entities.Lead.update(selectedLead.id, { notes: notesRef.current.value });
    } finally {
      setNotesSaving(false);
    }
  }, [selectedLead]);

  const handleMarkContacted = useCallback(async () => {
    if (!selectedLead) return;
    await base44.entities.Lead.update(selectedLead.id, { status: 'contacted' });
    // Optimistically update local lead
    setSelectedLead(prev => ({ ...prev, status: 'contacted' }));
  }, [selectedLead]);

  const handleSelectLead = useCallback((lead) => {
    setSelectedLead(lead);
  }, []);

  const handleBackToSearch = useCallback(() => {
    setSelectedLead(null);
    setSop(null);
  }, []);

  // Mobile block
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        className="fixed inset-0 z-50 bg-[#0B0F1A] flex flex-col items-center justify-center px-6"
      >
        <Phone className="w-10 h-10 text-slate-600 mb-4" />
        <p className="text-white text-center font-semibold mb-2">The Dial List Workspace is only available on desktop.</p>
        <p className="text-slate-400 text-sm text-center mb-6">Please use a screen wider than 1024px.</p>
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
          Close
        </button>
      </motion.div>
    );
  }

  // STATE 2: Lead Selected — Three-Panel Working View
  if (selectedLead) {
    const selClientName = displayClientMap[selectedLead.client_id] || clientMap[selectedLead.client_id] || 'Unknown Client';
    const selClient = clients.find(c => c.id === selectedLead.client_id);
    const closed = isClosed(selectedLead);
    const canFirstCall = selectedLead.status === 'new';
    const canContacted = selectedLead.status === 'new' || selectedLead.status === 'first_call_made';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        className="fixed inset-0 z-50 bg-[#0B0F1A] flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToSearch} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </button>
            <div className="h-5 w-px bg-slate-700" />
            <div>
              <h1 className="text-lg font-bold text-white">Dial List Workspace</h1>
              <p className="text-xs text-slate-500">Live Call View</p>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            End Session
          </button>
        </div>

        {/* Three-column grid */}
        <div className="flex-1 overflow-hidden grid" style={{ gridTemplateColumns: '320px 1fr 360px' }}>

          {/* LEFT PANEL — Lead Info & Actions */}
          <div className="bg-slate-900/50 border-r border-slate-700/50 p-4 space-y-4 overflow-y-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{selectedLead.name}</h2>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#D6FF03' }}>{selClientName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(selectedLead)}`}>
                  {getStatusLabel(selectedLead)}
                </span>
              </div>

              {closed && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    This lead was previously closed as <span className="font-semibold">{selectedLead.outcome || selectedLead.status}</span>. Actions below will reopen it.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2.5">
                {selectedLead.phone && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Phone</p>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-semibold text-white">{selectedLead.phone}</span>
                      <CopyButton text={selectedLead.phone} />
                    </div>
                  </div>
                )}
                {selectedLead.email && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-300 break-all">{selectedLead.email}</span>
                    </div>
                  </div>
                )}
                {selectedLead.lead_source && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Source</p>
                    <span className="text-xs text-slate-300 capitalize">{selectedLead.lead_source.replace('_', ' ')}</span>
                  </div>
                )}
                {(selectedLead.lead_received_date || selectedLead.created_date) && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Received</p>
                    <span className="text-xs text-slate-300">{fmt(selectedLead.lead_received_date || selectedLead.created_date)}</span>
                  </div>
                )}
                {selectedLead.speed_to_lead_minutes != null && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Speed to Lead</p>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-300">{selectedLead.speed_to_lead_minutes}m</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <SectionHeader icon={User} label="Quick Notes" />
              <textarea
                ref={notesRef}
                defaultValue={selectedLead.notes || ''}
                rows={5}
                placeholder="Add notes about this call..."
                className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] resize-y"
              />
              <button
                onClick={handleSaveNotes}
                disabled={notesSaving}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {notesSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-700/50 pt-4 space-y-2">
              <SectionHeader icon={Phone} label="Actions" />
              {canFirstCall && (
                <button
                  onClick={() => onAction?.({ type: 'first_call', lead: selectedLead })}
                  className="w-full px-3 py-2 text-sm font-bold rounded-lg text-black transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#D6FF03' }}
                >
                  Log First Call
                </button>
              )}
              <button
                onClick={() => onAction?.({ type: 'book', lead: selectedLead })}
                className="w-full px-3 py-2 text-sm font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                Book Appointment
              </button>
              {canContacted && (
                <button
                  onClick={handleMarkContacted}
                  className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  Mark Contacted
                </button>
              )}
              <button
                onClick={() => onAction?.({ type: 'disqualify', lead: selectedLead })}
                className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Disqualify
              </button>
            </div>
          </div>

          {/* CENTER PANEL — Call Script / SOP */}
          <div className="p-6 overflow-y-auto">
            {sopLoading ? (
              <div className="flex items-center gap-2 text-slate-400 mt-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading SOP...</span>
              </div>
            ) : sop && sop.call_script ? (
              <>
                <SectionHeader icon={FileText} label="Call Script" />
                <div className="mt-2">
                  <ReactMarkdown components={MD_PROSE}>{sop.call_script}</ReactMarkdown>
                </div>
                {sop.general_notes && (
                  <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <SectionHeader icon={FileText} label="General Notes" />
                    <div className="mt-2">
                      <ReactMarkdown components={MD_SMALL}>{sop.general_notes}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No SOP has been created for this client.</p>
                {user?.app_role === 'admin' && selClient && (
                  <button
                    onClick={() => window.open(`/client-view?client_id=${selClient.id}&tab=sop`, '_blank')}
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#D6FF03] hover:underline"
                  >
                    Create SOP <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL — FAQs & Reference */}
          <div className="bg-slate-900/30 border-l border-slate-700/50 p-4 overflow-y-auto space-y-5">
            {/* FAQs */}
            <div>
              <SectionHeader icon={HelpCircle} label="Frequently Asked Questions" />
              {sop?.faqs ? (
                <ReactMarkdown components={MD_SMALL}>{sop.faqs}</ReactMarkdown>
              ) : (
                <p className="text-xs text-slate-600">No FAQs added for this client.</p>
              )}
            </div>

            {/* Talking Points */}
            <div className="pt-4 border-t border-slate-700/50">
              <SectionHeader icon={MessageSquare} label="Talking Points" />
              {sop?.talking_points ? (
                <ReactMarkdown components={MD_SMALL}>{sop.talking_points}</ReactMarkdown>
              ) : (
                <p className="text-xs text-slate-600">No talking points added for this client.</p>
              )}
            </div>

            {/* Booking Link */}
            <div className="pt-4 border-t border-slate-700/50">
              <SectionHeader icon={Calendar} label="Booking Link" />
              {selClient?.booking_link ? (
                <div className="flex items-center gap-2">
                  <a
                    href={selClient.booking_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                  >
                    Open Booking Page <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  <CopyButton text={selClient.booking_link} />
                </div>
              ) : (
                <p className="text-xs text-slate-600">No booking link set for this client.</p>
              )}
            </div>

            {/* Lead History */}
            {(selectedLead.first_call_made_date || selectedLead.appointment_date || selectedLead.disposition || selectedLead.outcome) && (
              <div className="pt-4 border-t border-slate-700/50">
                <SectionHeader icon={Clock} label="Lead History" />
                <div className="space-y-2">
                  {selectedLead.first_call_made_date && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">First Call</span>
                      <span className="text-slate-300">{fmtDate(selectedLead.first_call_made_date)}</span>
                    </div>
                  )}
                  {selectedLead.date_appointment_set && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Appointment Set</span>
                      <span className="text-slate-300">{fmtDate(selectedLead.date_appointment_set)}</span>
                    </div>
                  )}
                  {selectedLead.appointment_date && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Appointment Date</span>
                      <span className="text-slate-300">{fmtDate(selectedLead.appointment_date)}</span>
                    </div>
                  )}
                  {selectedLead.disposition && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Disposition</span>
                      <span className="text-slate-300 capitalize">{selectedLead.disposition}</span>
                    </div>
                  )}
                  {selectedLead.outcome && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Outcome</span>
                      <span className="text-slate-300 capitalize">{selectedLead.outcome}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // STATE 1: Search Mode
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#0B0F1A] flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">Dial List Workspace</h1>
          <p className="text-xs text-slate-500">Search for a lead when you get a connection</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Search area — centered */}
      <div className="flex-1 flex flex-col items-center pt-[12vh] px-6 overflow-hidden">
        <div className="w-full max-w-2xl">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-12 pr-10 py-4 text-lg border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800/80 text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setDeepResults(null); setDeepQuery(null); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results container */}
          {debouncedQuery.length >= 2 && (
            <div className="mt-3 border border-slate-700/50 rounded-xl bg-slate-900/50 overflow-hidden">
              {/* Deep search label */}
              {showingDeep && (
                <div className="px-4 py-2 border-b border-slate-700/30 bg-blue-500/5">
                  <span className="text-xs font-medium text-blue-400">Results from full lead history</span>
                </div>
              )}

              {/* Results list */}
              <div className="max-h-[45vh] overflow-y-auto">
                {displayResults.length === 0 && !deepLoading ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      {showingDeep ? 'No leads found anywhere.' : 'No leads found in recent pipeline.'}
                    </p>
                  </div>
                ) : (
                  displayResults.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      clientName={displayClientMap[lead.client_id]}
                      onClick={() => handleSelectLead(lead)}
                    />
                  ))
                )}
              </div>

              {/* Deep search loading */}
              {deepLoading && (
                <div className="px-4 py-4 flex items-center justify-center gap-2 border-t border-slate-700/30">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-xs text-slate-400">Searching full history...</span>
                </div>
              )}

              {/* Deep search trigger button */}
              {showDeepSearchButton && !deepLoading && (
                <button
                  onClick={handleDeepSearch}
                  className="w-full px-4 py-3 flex items-center justify-center gap-2 border-t border-slate-700/30 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Not finding them? Search full history
                </button>
              )}

              {/* Add new lead button — always at bottom */}
              <button
                onClick={() => { if (onAddLead) setAddLeadOpen(true); }}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 border-t border-slate-700/30 text-sm text-[#D6FF03] hover:bg-slate-800/50 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Lead
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const DialWorkspace = memo(DialWorkspaceInner);
export default DialWorkspace;