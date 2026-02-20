import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Pencil, Trash2, Target, ExternalLink } from 'lucide-react';

const INDUSTRY_LABELS = {
  painting: 'Painting',
  epoxy: 'Epoxy',
  kitchen_bath: 'Kitchen & Bath',
  reno: 'Renovation',
};

const INDUSTRY_COLORS = {
  painting: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  epoxy: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  kitchen_bath: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  reno: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const GOAL_STATUS_CONFIG = {
  goal_met: { label: 'Goal Met', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
  on_track: { label: 'On Track', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  behind_confident: { label: 'Behind – Confident', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  behind_wont_meet: { label: 'Behind', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
};

const GOAL_TYPE_LABELS = { leads: 'Leads', sets: 'Sets', shows: 'Shows' };

export default function ClientCard({ client, stats, onEdit, onDelete }) {
  const goalCfg = client.goal_status ? GOAL_STATUS_CONFIG[client.goal_status] : null;
  const hasGoal = client.goal_type && client.goal_value;

  const borderColor = client.goal_status === 'behind_wont_meet'
    ? 'border-red-500/30 hover:border-red-500/50'
    : client.goal_status === 'goal_met'
    ? 'border-green-500/30 hover:border-green-500/50'
    : 'border-slate-700/50 hover:border-slate-600';

  return (
    <div className={`bg-slate-800/50 rounded-xl border ${borderColor} p-4 transition-all group relative`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <Link
            to={createPageUrl('ClientView') + `?clientId=${client.id}`}
            className="text-sm font-semibold text-white hover:text-[#D6FF03] transition-colors flex items-center gap-1.5 group/link"
          >
            <span className="truncate">{client.name}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
          </Link>
          {/* Industries */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {(client.industries || []).map(ind => (
              <span key={ind} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${INDUSTRY_COLORS[ind] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                {INDUSTRY_LABELS[ind] || ind}
              </span>
            ))}
            {(!client.industries || client.industries.length === 0) && (
              <span className="text-[10px] text-slate-600">No industry</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(client)} className="p-1.5 rounded-md hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 transition-colors" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(client)} className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Goal Status */}
      {hasGoal ? (
        <div className={`rounded-lg p-2.5 mb-3 border ${goalCfg ? goalCfg.border : 'border-slate-700/50'} ${goalCfg ? goalCfg.bg : 'bg-slate-900/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {goalCfg && <span className={`w-2 h-2 rounded-full ${goalCfg.dot}`} />}
              <span className={`text-xs font-semibold ${goalCfg ? goalCfg.text : 'text-slate-400'}`}>
                {goalCfg ? goalCfg.label : 'No Status'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              <Target className="w-3 h-3 inline mr-0.5" />
              {client.goal_value} {GOAL_TYPE_LABELS[client.goal_type] || client.goal_type}
            </span>
          </div>
          {/* Progress bar from stats */}
          {stats && stats.goalProgress != null && (
            <div className="mt-2">
              <div className="w-full h-1.5 rounded-full bg-slate-700/50">
                <div
                  className={`h-1.5 rounded-full transition-all ${goalCfg ? goalCfg.dot : 'bg-slate-500'}`}
                  style={{ width: `${Math.min(stats.goalProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-500">{stats.goalCurrent || 0} / {client.goal_value}</span>
                <span className="text-[9px] text-slate-500">{Math.round(stats.goalProgress || 0)}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg p-2.5 mb-3 border border-dashed border-slate-700/50 bg-slate-900/20">
          <p className="text-[10px] text-slate-600 text-center">No goal set</p>
        </div>
      )}

      {/* Quick stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Leads</p>
            <p className="text-sm font-bold text-slate-200">{stats.mtdLeads}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Booked</p>
            <p className="text-sm font-bold text-slate-200">{stats.mtdBooked}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Showed</p>
            <p className="text-sm font-bold text-slate-200">{stats.mtdShowed}</p>
          </div>
        </div>
      )}
    </div>
  );
}