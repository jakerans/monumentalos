import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Target, Save, Loader2, Check } from 'lucide-react';

const GOAL_TYPES = [
  { value: 'leads', label: 'Leads' },
  { value: 'sets', label: 'Sets (Appts Booked)' },
  { value: 'shows', label: 'Shows' },
];

const STATUS_OPTIONS = [
  { value: 'behind_wont_meet', label: "Behind – Won't Meet", bg: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'behind_confident', label: 'Behind – Confident', bg: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'on_track', label: 'On Track', bg: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'goal_met', label: 'Goal Met ✓', bg: 'bg-green-100 text-green-700 border-green-300' },
];

export default function ClientGoalEditor({ client, onSaved }) {
  const [goalType, setGoalType] = useState(client.goal_type || '');
  const [goalValue, setGoalValue] = useState(client.goal_value || '');
  const [goalStatus, setGoalStatus] = useState(client.goal_status || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGoalType(client.goal_type || '');
    setGoalValue(client.goal_value || '');
    setGoalStatus(client.goal_status || '');
    setSaved(false);
  }, [client.id]);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      goal_type: goalType || undefined,
      goal_value: goalValue ? Number(goalValue) : undefined,
      goal_status: goalStatus || undefined,
    };
    if (!goalType) {
      updates.goal_type = null;
      updates.goal_value = null;
      updates.goal_status = null;
    }
    await base44.entities.Client.update(client.id, updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onSaved) onSaved();
  };

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
        <Target className="w-3 h-3" /> Monthly Goal
      </p>
      <div className="space-y-2 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="block text-[9px] font-medium text-gray-500 mb-0.5">Goal Type</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None</option>
              {GOAL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-medium text-gray-500 mb-0.5">Target #</label>
            <input
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              placeholder="e.g. 20"
              disabled={!goalType}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>
        {goalType && goalValue && (
          <div>
            <label className="block text-[9px] font-medium text-gray-500 mb-1">Status</label>
            <div className="grid grid-cols-2 gap-1">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGoalStatus(opt.value)}
                  className={`px-2 py-1.5 text-[10px] font-semibold rounded-md border transition-all ${
                    goalStatus === opt.value
                      ? opt.bg + ' ring-1 ring-offset-1 ring-current shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full px-3 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
          }`}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Goal'}
        </button>
      </div>
    </div>
  );
}