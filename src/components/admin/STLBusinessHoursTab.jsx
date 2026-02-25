import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Clock, Save, Moon } from 'lucide-react';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
];

function formatHour(h) {
  if (h === 0 || h === 24) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function STLBusinessHoursTab() {
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(20);
  const [timezone, setTimezone] = useState('America/New_York');
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const records = await base44.entities.CompanySettings.filter({ key: 'stl_business_hours' });
      if (records.length > 0) {
        setExistingId(records[0].id);
        try {
          const parsed = typeof records[0].value === 'string' ? JSON.parse(records[0].value) : records[0].value;
          setStartHour(parsed.start_hour ?? 10);
          setEndHour(parsed.end_hour ?? 20);
          setTimezone(parsed.timezone ?? 'America/New_York');
        } catch { /* use defaults */ }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const value = JSON.stringify({ start_hour: startHour, end_hour: endHour, timezone });
    if (existingId) {
      await base44.entities.CompanySettings.update(existingId, { value });
    } else {
      const created = await base44.entities.CompanySettings.create({ key: 'stl_business_hours', value });
      setExistingId(created.id);
    }
    setSaving(false);
    toast({ title: 'Business Hours Saved', description: `STL window: ${formatHour(startHour)} – ${formatHour(endHour)}`, variant: 'success' });
  };

  if (loading) return <div className="text-slate-400 text-sm p-4">Loading...</div>;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-md bg-amber-500/10">
          <Moon className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">STL Business Hours</h3>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        Leads received outside business hours are tagged as <span className="text-slate-300 font-medium">"Overnight"</span> and excluded from Speed-to-Lead calculations. This prevents overnight leads from unfairly inflating setter STL averages.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Start Hour</label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          >
            {HOURS.map(h => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">End Hour</label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          >
            {HOURS.map(h => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-slate-500">
          Current window: <span className="text-slate-300 font-medium">{formatHour(startHour)} – {formatHour(endHour)}</span> · {TIMEZONES.find(t => t.value === timezone)?.label}
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#D6FF03' }}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}