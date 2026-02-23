import React, { useState, useMemo } from 'react';
import { Inbox, PhoneCall, CalendarCheck, CheckCircle2, Ban, AlertTriangle, Search, ChevronLeft, ChevronRight, Calendar, Phone, Mail } from 'lucide-react';
import RetainerLeadCard from './RetainerLeadCard';

const STATUS_BADGES = {
  new: { label: 'New', cls: 'text-black font-bold', bg: '#D6FF03' },
  first_call_made: { label: 'Called', cls: 'text-white', bg: 'rgb(59,130,246)' },
  contacted: { label: 'Contacted', cls: 'text-white', bg: 'rgb(168,85,247)' },
  appointment_booked: { label: 'Booked', cls: 'text-white', bg: 'rgb(34,197,94)' },
};

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function RetainerPortalView({ kpis, leads, pagination, page, onPageChange, onSelectLead }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredLeads = useMemo(() => {
    let list = leads;
    if (statusFilter !== 'all') {
      const map = { new: 'new', called: 'first_call_made', contacted: 'contacted', booked: 'appointment_booked' };
      list = list.filter(l => l.status === map[statusFilter]);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, statusFilter, search]);

  const kpiCards = [
    { label: 'New Leads', value: kpis.newCount ?? 0, icon: Inbox, color: '#D6FF03' },
    { label: 'Contacted', value: kpis.contactedCount ?? 0, icon: PhoneCall, color: 'rgb(96,165,250)' },
    { label: 'Booked', value: kpis.bookedCount ?? 0, icon: CalendarCheck, color: 'rgb(74,222,128)' },
    { label: 'Completed', value: kpis.completedCount ?? 0, icon: CheckCircle2, color: 'rgb(192,132,252)' },
    { label: 'Disqualified', value: kpis.disqualifiedCount ?? 0, icon: Ban, color: 'rgb(148,163,184)' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border border-slate-700/50">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color }} />
              <p className="text-[10px] sm:text-sm font-medium text-slate-400">{label}</p>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Needs Attention Banner */}
      {(kpis.needsAttentionCount ?? 0) > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 sm:p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">{kpis.needsAttentionCount} lead{kpis.needsAttentionCount > 1 ? 's' : ''} need your attention</p>
            <p className="text-xs text-amber-400/70 mt-0.5">These leads came in over 24 hours ago and haven't been contacted yet.</p>
          </div>
        </div>
      )}

      {/* Lead Queue Header + Filters */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-xl font-bold text-white">Lead Queue</h2>
            <p className="text-xs text-slate-500">{pagination.total_count} active lead{pagination.total_count !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="called">Called</option>
              <option value="contacted">Contacted</option>
              <option value="booked">Booked</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone…"
                className="pl-7 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03] w-44"
              />
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-6 text-center text-slate-500">No leads match your filters</div>
          ) : filteredLeads.map((lead) => (
            <div key={lead.id} className={lead._isStale ? 'ring-1 ring-amber-500/50 rounded-lg' : ''}>
              <RetainerLeadCard
                lead={lead}
                onSelect={onSelectLead}
                isStale={lead._isStale}
              />
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-slate-800/50 rounded-lg shadow border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Industry</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Project</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Received</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Appointment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No leads match your filters</td></tr>
                ) : filteredLeads.map((lead) => {
                  const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.new;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className={`cursor-pointer transition-colors ${lead._isStale ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-700/20'}`}
                    >
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${badge.cls}`} style={{ backgroundColor: badge.bg }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-white">{lead.name}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">
                        {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-600" />{lead.phone}</div>}
                        {lead.email && <div className="flex items-center gap-1 truncate max-w-[180px]"><Mail className="w-3 h-3 text-slate-600" />{lead.email}</div>}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{lead.industries?.join(', ') || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{lead.project_type || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          {relativeTime(lead.created_date || lead.lead_received_date)}
                          {lead._isStale && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {lead.status === 'appointment_booked' && lead.appointment_date
                          ? new Date(lead.appointment_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-xs text-slate-500">
              Showing {page * pagination.page_size + 1}–{Math.min((page + 1) * pagination.page_size, pagination.total_count)} of {pagination.total_count}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.total_pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`w-7 h-7 text-xs font-medium rounded-md ${
                    i === page ? 'bg-[#D6FF03] text-black' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, page - 2), Math.min(pagination.total_pages, page + 3))}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={!pagination.has_more}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}