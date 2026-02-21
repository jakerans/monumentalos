import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Trash2, Users, User, Clock, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function getDateRangeForSpiff(spiff) {
  const now = new Date();
  if (spiff.is_daily && spiff.due_date) {
    const dayStart = new Date(spiff.due_date + 'T00:00:00');
    const dayEnd = new Date(spiff.due_date + 'T23:59:59');
    return { rangeStart: dayStart, rangeEnd: dayEnd };
  }
  return { rangeStart: new Date(now.getFullYear(), now.getMonth(), 1), rangeEnd: now };
}

function SpiffProgressBar({ spiff, leads, users }) {
  const { rangeStart, rangeEnd } = getDateRangeForSpiff(spiff);
  const setters = users.filter(u => u.app_role === 'setter');

  const inRange = (d) => d ? new Date(d) >= rangeStart && new Date(d) <= rangeEnd : false;

  const getProgress = (setterId) => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => l.booked_by_setter_id === setterId && inRange(l.date_appointment_set)).length;
    }
    const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && inRange(l.created_date));
    return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
  };

  const getTeamProgress = () => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => inRange(l.date_appointment_set)).length;
    }
    const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && inRange(l.created_date));
    return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
  };

  const isSTL = spiff.qualifier === 'stl';

  if (spiff.scope === 'individual') {
    const setter = users.find(u => u.id === spiff.assigned_setter_id);
    const progress = getProgress(spiff.assigned_setter_id);
    const pct = isSTL
      ? (progress != null ? Math.min((spiff.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
      : (spiff.goal_value > 0 ? Math.min((progress / spiff.goal_value) * 100, 100) : 0);

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
          <span>{setter?.full_name || 'Unknown'}</span>
          <span>{isSTL ? `${progress ?? '—'}m / ≤${spiff.goal_value}m` : `${progress} / ${spiff.goal_value}`}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full">
          <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  if (spiff.scope === 'team_company') {
    const progress = getTeamProgress();
    const pct = isSTL
      ? (progress != null ? Math.min((spiff.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
      : (spiff.goal_value > 0 ? Math.min((progress / spiff.goal_value) * 100, 100) : 0);

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
          <span>Team Total</span>
          <span>{isSTL ? `${progress ?? '—'}m / ≤${spiff.goal_value}m` : `${progress} / ${spiff.goal_value}`}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full">
          <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  // team_each — show each setter
  return (
    <div className="mt-2 space-y-1.5">
      {setters.map(setter => {
        const progress = getProgress(setter.id);
        const pct = isSTL
          ? (progress != null ? Math.min((spiff.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
          : (spiff.goal_value > 0 ? Math.min((progress / spiff.goal_value) * 100, 100) : 0);
        return (
          <div key={setter.id}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>{setter.full_name}</span>
              <span>{isSTL ? `${progress ?? '—'}m / ≤${spiff.goal_value}m` : `${progress} / ${spiff.goal_value}`}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full">
              <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function checkSpiffGoalMet(spiff, leads, users) {
  const { rangeStart, rangeEnd } = getDateRangeForSpiff(spiff);
  const setters = users.filter(u => u.app_role === 'setter');

  const inRange = (d) => d ? new Date(d) >= rangeStart && new Date(d) <= rangeEnd : false;

  const getProgress = (setterId) => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => l.booked_by_setter_id === setterId && inRange(l.date_appointment_set)).length;
    }
    const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && inRange(l.created_date));
    return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
  };

  const getTeamProgress = () => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => inRange(l.date_appointment_set)).length;
    }
    const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && inRange(l.created_date));
    return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
  };

  const isSTL = spiff.qualifier === 'stl';
  const goal = spiff.goal_value;

  const isMet = (progress) => {
    if (progress == null) return false;
    return isSTL ? progress <= goal : progress >= goal;
  };

  if (spiff.scope === 'individual') {
    return isMet(getProgress(spiff.assigned_setter_id));
  }
  if (spiff.scope === 'team_company') {
    return isMet(getTeamProgress());
  }
  // team_each: met if ALL setters meet it
  return setters.length > 0 && setters.every(s => isMet(getProgress(s.id)));
}

export default function SpiffManager({ leads, users }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', scope: 'team_each', assigned_setter_id: '',
    qualifier: 'appointments', goal_value: '', reward: '', due_date: '', is_daily: false, status: 'active',
    loot_box_enabled: false, loot_box_rarity: 'common',
  });

  const { data: spiffs = [], refetch } = useQuery({
    queryKey: ['admin-spiffs'],
    queryFn: () => base44.entities.Spiff.list('-created_date'),
  });

  // Auto-update spiff statuses
  React.useEffect(() => {
    if (spiffs.length === 0 || !leads.length) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    spiffs.filter(s => s.status === 'active').forEach(async (spiff) => {
      const goalMet = checkSpiffGoalMet(spiff, leads, users);
      if (goalMet) {
        await base44.entities.Spiff.update(spiff.id, { status: 'completed' });

        // Award loot boxes if enabled
        if (spiff.loot_box_enabled && spiff.loot_box_rarity) {
          const settersToAward = [];
          if (spiff.scope === 'individual' && spiff.assigned_setter_id) {
            settersToAward.push(spiff.assigned_setter_id);
          } else {
            // team_each or team_company — award each setter who met the goal individually
            const { rangeStart, rangeEnd } = getDateRangeForSpiff(spiff);
            const inRange = (d) => d ? new Date(d) >= rangeStart && new Date(d) <= rangeEnd : false;
            const allSetters = users.filter(u => u.app_role === 'setter');
            const isSTL = spiff.qualifier === 'stl';

            for (const setter of allSetters) {
              let progress;
              if (spiff.qualifier === 'appointments') {
                progress = leads.filter(l => l.booked_by_setter_id === setter.id && inRange(l.date_appointment_set)).length;
              } else {
                const stlLeads = leads.filter(l => l.setter_id === setter.id && l.speed_to_lead_minutes != null && inRange(l.created_date));
                progress = stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
              }
              const met = progress != null && (isSTL ? progress <= spiff.goal_value : progress >= spiff.goal_value);
              if (met) settersToAward.push(setter.id);
            }
          }

          for (const setterId of settersToAward) {
            await base44.entities.LootBox.create({
              setter_id: setterId,
              rarity: spiff.loot_box_rarity,
              status: 'unopened',
              awarded_date: todayStr,
              source: 'spiff_reward',
              spiff_id: spiff.id,
            });
          }
        }

        refetch();
      } else if (spiff.is_daily && spiff.due_date && spiff.due_date < todayStr) {
        // Daily spiff expired — day has passed without meeting goal
        await base44.entities.Spiff.update(spiff.id, { status: 'expired' });
        refetch();
      } else if (!spiff.is_daily && spiff.due_date && spiff.due_date < todayStr) {
        await base44.entities.Spiff.update(spiff.id, { status: 'expired' });
        refetch();
      }
    });
  }, [spiffs, leads, users]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Spiff.create(data),
    onSuccess: () => { refetch(); setCreateOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Spiff.delete(id),
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setForm({
      title: '', description: '', scope: 'team_each', assigned_setter_id: '',
      qualifier: 'appointments', goal_value: '', reward: '', cash_value: 0,
      due_date: endOfMonth.toISOString().split('T')[0], is_daily: false, status: 'active',
      loot_box_enabled: false, loot_box_rarity: 'common',
    });
  };

  const handleCreate = () => {
    const data = {
      ...form,
      goal_value: Number(form.goal_value),
      cash_value: Number(form.cash_value) || 0,
      due_date: form.due_date,
      loot_box_enabled: form.loot_box_enabled,
      loot_box_rarity: form.loot_box_enabled ? form.loot_box_rarity : undefined,
      ...(form.scope !== 'individual' ? { assigned_setter_id: undefined } : {}),
    };
    createMutation.mutate(data);
  };

  const setters = users.filter(u => u.app_role === 'setter');
  const activeSpiffs = spiffs.filter(s => s.status === 'active');
  const pastSpiffs = spiffs.filter(s => s.status !== 'active');

  const SCOPE_LABELS = { individual: 'Individual', team_each: 'Team (Each)', team_company: 'Team (Company)' };
  const SCOPE_ICONS = { individual: User, team_each: Users, team_company: Target };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Spiffs & Bonuses</h3>
        </div>
        <button
          onClick={() => { resetForm(); setCreateOpen(true); }}
          className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 text-black hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}
        >
          <Plus className="w-3 h-3" /> Add Spiff
        </button>
      </div>

      <div className="divide-y divide-slate-700/30">
        {activeSpiffs.length === 0 && (
          <div className="px-4 py-6 text-xs text-slate-500 text-center">No active spiffs. Create one to motivate the team!</div>
        )}
        {activeSpiffs.map(sp => {
          const ScopeIcon = SCOPE_ICONS[sp.scope] || Users;
          return (
            <div key={sp.id} className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white">{sp.title}</p>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                      <ScopeIcon className="w-2.5 h-2.5" />
                      {SCOPE_LABELS[sp.scope]}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sp.qualifier === 'appointments' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {sp.qualifier === 'appointments' ? 'Appointments' : 'STL'}
                    </span>
                  </div>
                  {sp.description && <p className="text-[10px] text-slate-500 mt-0.5">{sp.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    {sp.reward && <span className="text-purple-400 font-medium">{sp.reward}</span>}
                    {sp.is_daily && sp.due_date && (
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        🔥 Daily — {new Date(sp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {sp.due_date && !sp.is_daily && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Due {new Date(sp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <span>Goal: {sp.qualifier === 'stl' ? `≤${sp.goal_value}m` : sp.goal_value}</span>
                    {sp.loot_box_enabled && (
                      <span className="text-purple-400 font-medium">🎁 Loot Box: {sp.loot_box_rarity?.charAt(0).toUpperCase() + sp.loot_box_rarity?.slice(1)}</span>
                    )}
                    </div>
                    </div>
                    <button onClick={() => deleteMutation.mutate(sp.id)} className="text-slate-600 hover:text-red-400 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    </div>
                    <SpiffProgressBar spiff={sp} leads={leads} users={users} />
            </div>
          );
        })}

        {pastSpiffs.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Past Spiffs</p>
            {pastSpiffs.slice(0, 10).map(sp => {
              const isExpired = sp.status === 'expired';
              const ScopeIcon = SCOPE_ICONS[sp.scope] || Users;
              return (
                <div key={sp.id} className={`relative overflow-hidden rounded-lg my-1.5 ${isExpired ? 'opacity-50' : ''}`}>
                  <div className="px-3 py-2.5 bg-slate-700/30 border border-slate-700/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[11px] font-medium text-slate-400 truncate">{sp.title}</span>
                        <span className="flex items-center gap-0.5 text-[9px] text-slate-600 bg-slate-700/50 px-1 py-0.5 rounded shrink-0">
                          <ScopeIcon className="w-2.5 h-2.5" />
                          {SCOPE_LABELS[sp.scope]}
                        </span>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${sp.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                          {sp.status === 'completed' ? '✓ Completed' : sp.status}
                        </span>
                      </div>
                      <button onClick={() => deleteMutation.mutate(sp.id)} className="text-slate-600 hover:text-red-400 p-1 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-600">
                      {sp.reward && <span>{sp.reward}</span>}
                      {sp.due_date && <span>Due {new Date(sp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      <span>Goal: {sp.qualifier === 'stl' ? `≤${sp.goal_value}m` : sp.goal_value}</span>
                    </div>
                  </div>
                  {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-red-500/30 text-2xl font-black uppercase tracking-[0.2em] -rotate-12 select-none" style={{ textShadow: '0 0 2px rgba(239,68,68,0.2)' }}>
                        EXPIRED
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Spiff Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create Spiff / Bonus</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                placeholder="e.g. February Booking Blitz" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                placeholder="Short description..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Scope</label>
                <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]">
                  <option value="team_each">Team (Each Setter)</option>
                  <option value="team_company">Team (Company Goal)</option>
                  <option value="individual">Individual Setter</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Qualifier</label>
                <select value={form.qualifier} onChange={e => setForm({ ...form, qualifier: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]">
                  <option value="appointments">Set Appointments</option>
                  <option value="stl">Speed to Lead (avg)</option>
                </select>
              </div>
            </div>
            {form.scope === 'individual' && (
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Assign to Setter</label>
                <select value={form.assigned_setter_id} onChange={e => setForm({ ...form, assigned_setter_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]">
                  <option value="">Select setter...</option>
                  {setters.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">
                  {form.qualifier === 'stl' ? 'Target STL (minutes)' : 'Target Appointments'}
                </label>
                <input type="number" value={form.goal_value} onChange={e => setForm({ ...form, goal_value: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                  placeholder={form.qualifier === 'stl' ? 'e.g. 5' : 'e.g. 20'} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Reward</label>
                <input value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                  placeholder="e.g. $200 bonus" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Cash Value ($)</label>
              <p className="text-[10px] text-slate-500 mb-1">Dollar amount to pay — used for payroll summary</p>
              <input type="number" value={form.cash_value} onChange={e => setForm({ ...form, cash_value: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                placeholder="e.g. 200" />
            </div>
            {/* Daily Spiff Toggle */}
            <div className="flex items-center gap-3 py-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_daily: !form.is_daily })}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_daily ? 'bg-orange-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_daily ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <span className="text-xs text-white font-medium">Daily Spiff</span>
                <p className="text-[10px] text-slate-500">Only counts activity on the chosen day — expires at EOD if not met</p>
              </div>
            </div>

            {form.is_daily ? (
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Spiff Day</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]" />
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]" />
              </div>
            )}

            {/* Loot Box Award Toggle */}
            <div className="flex items-center gap-3 py-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, loot_box_enabled: !form.loot_box_enabled })}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.loot_box_enabled ? 'bg-purple-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.loot_box_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <span className="text-xs text-white font-medium">Award Loot Box on Completion</span>
                <p className="text-[10px] text-slate-500">Winning setters receive a guaranteed loot box</p>
              </div>
            </div>
            {form.loot_box_enabled && (
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Loot Box Rarity</label>
                <select value={form.loot_box_rarity} onChange={e => setForm({ ...form, loot_box_rarity: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]">
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={!form.title || !form.goal_value || (form.scope === 'individual' && !form.assigned_setter_id)}
              className="w-full py-2 text-sm font-bold rounded-lg text-black disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: '#D6FF03' }}
            >
              Create Spiff
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}