import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Trash2, Users, User, Clock, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function SpiffProgressBar({ spiff, leads, users }) {
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const setters = users.filter(u => u.app_role === 'setter');

  const getProgress = (setterId) => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => l.booked_by_setter_id === setterId && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    }
    const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
    return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
  };

  const getTeamProgress = () => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    }
    const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
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
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const setters = users.filter(u => u.app_role === 'setter');

  const getProgress = (setterId) => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => l.booked_by_setter_id === setterId && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    }
    const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
    return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
  };

  const getTeamProgress = () => {
    if (spiff.qualifier === 'appointments') {
      return leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    }
    const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
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
        refetch();
      } else if (spiff.due_date && spiff.due_date < todayStr) {
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
      qualifier: 'appointments', goal_value: '', reward: '',
      due_date: endOfMonth.toISOString().split('T')[0], is_daily: false, status: 'active',
    });
  };

  const handleCreate = () => {
    const finalDueDate = form.is_daily ? new Date().toISOString().split('T')[0] : form.due_date;
    const data = {
      ...form,
      goal_value: Number(form.goal_value),
      due_date: finalDueDate,
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
                    {sp.is_daily && (
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">🔥 Daily</span>
                    )}
                    {sp.due_date && !sp.is_daily && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Due {new Date(sp.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <span>Goal: {sp.qualifier === 'stl' ? `≤${sp.goal_value}m` : sp.goal_value}</span>
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
            {pastSpiffs.slice(0, 5).map(sp => (
              <div key={sp.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{sp.title}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded ${sp.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                    {sp.status}
                  </span>
                </div>
                <button onClick={() => deleteMutation.mutate(sp.id)} className="text-slate-600 hover:text-red-400 p-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
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
                <p className="text-[10px] text-slate-500">Due by end of today — shows blazing banner on setter dashboard</p>
              </div>
            </div>

            {!form.is_daily && (
              <div>
                <label className="text-[10px] text-slate-400 uppercase mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]" />
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