import React from 'react';
import { CalendarCheck, TrendingUp, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentCard from './AppointmentCard';

const PAGE_SIZE = 20;

export default function PerformancePortalView({ kpis, leads, pagination, page, onPageChange, onSelectLead, onQuickOutcome }) {
  const needsOutcomeLeads = leads.filter(l => l._needsOutcome);
  const upcomingLeads = leads.filter(l => !l._needsOutcome);
  const showRate = kpis.scheduledMTD > 0 ? Math.round((kpis.showedMTD / kpis.scheduledMTD) * 100) + '%' : '—';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4" data-tour="performance-kpis">
        <KPICard icon={CalendarCheck} color="rgb(96,165,250)" label="Booked This Month" value={kpis.scheduledMTD} />
        <KPICard icon={TrendingUp} color="rgb(74,222,128)" label="Show Rate" value={showRate} />
        <KPICard icon={CheckCircle} color="rgb(52,211,153)" label="Showed" value={kpis.showedMTD} />
        <KPICard
          icon={AlertTriangle}
          color="rgb(248,113,113)"
          label="Needs Outcome"
          value={kpis.needsOutcomeCount}
          alert={kpis.needsOutcomeCount > 0}
        />
      </div>

      {/* Action Queue */}
      {needsOutcomeLeads.length > 0 && (
        <div data-tour="performance-action-queue">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-white">Confirm Outcomes</h2>
            <p className="text-xs text-red-400">{needsOutcomeLeads.length} appointment{needsOutcomeLeads.length !== 1 ? 's' : ''} need your input</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 mb-3">
            These appointments have already occurred. Please confirm whether the homeowner showed up and report the outcome.
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3 mb-3">
            {needsOutcomeLeads.map(lead => (
              <div key={lead.id} className="ring-1 ring-red-500/50 rounded-lg">
                <AppointmentCard
                  lead={lead}
                  onSelect={() => onSelectLead(lead.id)}
                  needsOutcome
                  onQuickOutcome={onQuickOutcome}
                />
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block bg-slate-800/50 rounded-lg shadow border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Lead Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Appointment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Disposition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Outcome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {needsOutcomeLeads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className="cursor-pointer bg-red-500/5 hover:bg-red-500/10"
                    >
                      <td className="px-6 py-4 font-medium text-red-400">
                        {lead.name}
                        <span className="ml-1.5 text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">NEEDS OUTCOME</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {lead.appointment_date ? new Date(lead.appointment_date).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4"><DispositionBadge value={lead.disposition} /></td>
                      <td className="px-6 py-4"><OutcomeBadge value={lead.outcome} /></td>
                      <td className="px-6 py-4">
                        <button
                          {...(idx === 0 ? { 'data-tour': 'performance-outcome-btn' } : {})}
                          onClick={(e) => { e.stopPropagation(); onQuickOutcome(lead); }}
                          className="px-3 py-1 text-xs font-bold text-black rounded-full hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: '#D6FF03' }}
                        >
                          Update Outcome
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-700/50 my-4" />
        </div>
      )}

      {/* Upcoming Appointments */}
      <div data-tour="performance-upcoming">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-white">Upcoming Appointments</h2>
          <p className="text-xs text-slate-400">{upcomingLeads.length} scheduled</p>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3 mb-3">
          {upcomingLeads.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg shadow border border-slate-700/50 p-6 text-center text-slate-500">No upcoming appointments scheduled</div>
          ) : upcomingLeads.map(lead => (
            <AppointmentCard
              key={lead.id}
              lead={lead}
              onSelect={() => onSelectLead(lead.id)}
              needsOutcome={false}
            />
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden md:block bg-slate-800/50 rounded-lg shadow border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Appointment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Disposition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {upcomingLeads.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No upcoming appointments scheduled</td></tr>
                ) : upcomingLeads.map(lead => (
                  <tr key={lead.id} onClick={() => onSelectLead(lead.id)} className="cursor-pointer hover:bg-slate-700/20">
                    <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      <div>{lead.email}</div>
                      <div>{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {lead.appointment_date ? new Date(lead.appointment_date).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4"><DispositionBadge value={lead.disposition} /></td>
                    <td className="px-6 py-4"><OutcomeBadge value={lead.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, pagination.total_count)} of {pagination.total_count}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 0} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`w-7 h-7 text-xs font-medium rounded-md ${i === page ? 'bg-[#D6FF03] text-black' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, page - 2), Math.min(pagination.total_pages, page + 3))}
            <button onClick={() => onPageChange(page + 1)} disabled={!pagination.has_more} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, color, label, value, alert }) {
  return (
    <div
      className={`bg-slate-800/50 rounded-lg shadow p-3 sm:p-5 border ${alert ? 'border-red-500/30' : 'border-slate-700/50'}`}
      style={alert ? { backgroundColor: 'rgba(239,68,68,0.08)' } : {}}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color }} />
        <p className={`text-[10px] sm:text-sm font-medium ${alert ? 'text-red-400' : 'text-slate-400'}`}>{label}</p>
      </div>
      <p className={`text-lg sm:text-3xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function DispositionBadge({ value }) {
  if (!value) return <span className="text-slate-600">—</span>;
  const cls = value === 'showed' ? 'bg-green-100 text-green-800'
    : value === 'cancelled' ? 'bg-red-100 text-red-800'
    : value === 'rescheduled' ? 'bg-purple-100 text-purple-800'
    : 'bg-blue-100 text-blue-800';
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{value}</span>;
}

function OutcomeBadge({ value }) {
  if (!value) return <span className="text-slate-600">—</span>;
  const cls = value === 'sold' ? 'bg-green-100 text-green-800'
    : value === 'lost' ? 'bg-red-100 text-red-800'
    : 'bg-yellow-100 text-yellow-800';
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{value}</span>;
}