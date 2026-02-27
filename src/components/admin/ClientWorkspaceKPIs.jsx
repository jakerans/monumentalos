import React from 'react';
import { Users, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

const INDUSTRY_LABELS = {
  painting: 'Painting',
  epoxy: 'Epoxy',
  kitchen_bath: 'Kitchen & Bath',
  reno: 'Renovation',
};

export default function ClientWorkspaceKPIs({ clients }) {
  const active = clients.filter(c => c.status !== 'inactive');
  const inactive = clients.filter(c => c.status === 'inactive');

  const withGoal = active.filter(c => c.goal_type && c.goal_value);
  const goalMet = withGoal.filter(c => c.goal_status === 'goal_met').length;
  const onTrack = withGoal.filter(c => c.goal_status === 'on_track').length;
  const behindConf = withGoal.filter(c => c.goal_status === 'behind_confident').length;
  const behindWont = withGoal.filter(c => c.goal_status === 'behind_wont_meet').length;
  const noGoal = active.filter(c => !c.goal_type || !c.goal_value).length;
  const needsAttention = behindWont;

  // Industry breakdown
  const industryCounts = {};
  active.forEach(c => {
    (c.industries || []).forEach(ind => {
      industryCounts[ind] = (industryCounts[ind] || 0) + 1;
    });
  });

  const cards = [
    { label: 'Active Clients', value: active.length, sub: inactive.length > 0 ? `${inactive.length} inactive` : null, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Goals Met', value: goalMet, sub: `${onTrack} on track`, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Needs Attention', value: needsAttention, sub: `${behindConf} behind but confident`, icon: AlertTriangle, color: needsAttention > 0 ? 'text-red-400' : 'text-slate-400', bg: needsAttention > 0 ? 'bg-red-500/10' : 'bg-slate-700/30', border: needsAttention > 0 ? 'border-red-500/20' : 'border-slate-700/50' },
    { label: 'No Goal Set', value: noGoal, sub: `of ${active.length} active`, icon: Target, color: noGoal > 0 ? 'text-amber-400' : 'text-slate-400', bg: noGoal > 0 ? 'bg-amber-500/10' : 'bg-slate-700/30', border: noGoal > 0 ? 'border-amber-500/20' : 'border-slate-700/50' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <span className="text-[11px] font-medium text-slate-400">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              {c.sub && <p className="text-[11px] text-slate-500 mt-0.5">{c.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Industry pills */}
      {Object.keys(industryCounts).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Industries:</span>
          {Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).map(([ind, count]) => (
            <span key={ind} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700/50 text-slate-300">
              {INDUSTRY_LABELS[ind] || ind} <span className="text-slate-500 ml-0.5">({count})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}