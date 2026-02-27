import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Filter, Plus, LayoutGrid, List } from 'lucide-react';
import ClientCard from './ClientCard';
import DeleteClientDialog from './DeleteClientDialog';
import EditClientModal from '../onboard/EditClientModal';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const GOAL_FILTERS = [
  { value: 'all', label: 'All Goals' },
  { value: 'goal_met', label: 'Goal Met' },
  { value: 'on_track', label: 'On Track' },
  { value: 'behind_confident', label: 'Behind – Confident' },
  { value: 'behind_wont_meet', label: 'Behind' },
  { value: 'no_goal', label: 'No Goal' },
];

const INDUSTRY_FILTERS = [
  { value: 'all', label: 'All Industries' },
  { value: 'painting', label: 'Painting' },
  { value: 'epoxy', label: 'Epoxy' },
  { value: 'kitchen_bath', label: 'Kitchen & Bath' },
  { value: 'reno', label: 'Renovation' },
];

export default function ClientGrid({ clients, leads, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [goalFilter, setGoalFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [deleteClient, setDeleteClient] = useState(null);
  const [editClient, setEditClient] = useState(null);

  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Build stats map
  const statsMap = useMemo(() => {
    const map = {};
    clients.forEach(client => {
      const cLeads = leads.filter(l => l.client_id === client.id);
      const mtdLeads = cLeads.filter(l => {
        const d = l.lead_received_date || l.created_date;
        return d && new Date(d) >= mtdStart;
      }).length;
      const mtdBooked = cLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
      const mtdShowed = cLeads.filter(l => (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost') && l.appointment_date && new Date(l.appointment_date) >= mtdStart).length;

      let goalProgress = null;
      let goalCurrent = null;
      if (client.goal_type && client.goal_value) {
        if (client.goal_type === 'leads') goalCurrent = mtdLeads;
        else if (client.goal_type === 'sets') goalCurrent = mtdBooked;
        else if (client.goal_type === 'shows') goalCurrent = mtdShowed;
        goalProgress = client.goal_value > 0 ? (goalCurrent / client.goal_value) * 100 : 0;
      }

      map[client.id] = { mtdLeads, mtdBooked, mtdShowed, goalProgress, goalCurrent };
    });
    return map;
  }, [clients, leads]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const effectiveStatus = (c.status === 'inactive') ? 'inactive' : 'active';
      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
      if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (industryFilter !== 'all' && !(c.industries || []).includes(industryFilter)) return false;
      if (goalFilter !== 'all') {
        if (goalFilter === 'no_goal') {
          if (c.goal_type && c.goal_value) return false;
        } else {
          if (c.goal_status !== goalFilter) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // Sort: behind_wont_meet first, then by name
      const priority = { behind_wont_meet: 0, behind_confident: 1, on_track: 2, goal_met: 3 };
      const pa = priority[a.goal_status] ?? 4;
      const pb = priority[b.goal_status] ?? 4;
      if (pa !== pb) return pa - pb;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [clients, search, statusFilter, goalFilter, industryFilter]);

  const selectClass = "px-2.5 py-1.5 text-xs bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D6FF03]";

  return (
    <>
      {/* Toolbar */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/50 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D6FF03] placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
              {STATUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={goalFilter} onChange={e => setGoalFilter(e.target.value)} className={selectClass}>
              {GOAL_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className={selectClass}>
              {INDUSTRY_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <Link
            to={createPageUrl('OnboardDashboard')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 text-black shrink-0"
            style={{ backgroundColor: '#D6FF03' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Client
          </Link>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">
          Showing {filtered.length} of {clients.length} clients
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 py-12 text-center">
          <p className="text-sm text-slate-500">No clients match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              stats={statsMap[client.id]}
              onEdit={setEditClient}
              onDelete={setDeleteClient}
            />
          ))}
        </div>
      )}

      <DeleteClientDialog
        client={deleteClient}
        open={!!deleteClient}
        onOpenChange={(open) => { if (!open) setDeleteClient(null); }}
        onDeleted={onRefresh}
      />
      {editClient && (
        <EditClientModal
          client={editClient}
          open={!!editClient}
          onOpenChange={(open) => { if (!open) setEditClient(null); }}
          onSaved={() => { setEditClient(null); onRefresh?.(); }}
        />
      )}
    </>
  );
}