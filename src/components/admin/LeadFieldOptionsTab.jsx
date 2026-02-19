import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Loader2, Paintbrush, Wrench, Hammer, Home } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const INDUSTRY_META = {
  painting: { label: 'Painting', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  epoxy: { label: 'Epoxy', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  kitchen_bath: { label: 'Kitchen & Bath', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  reno: { label: 'Renovation', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

const DEFAULT_PROJECT_SIZES = ['Partial Project', 'Full Project'];

const DEFAULT_PROJECT_TYPES = {
  painting: ['Interior', 'Exterior', 'Cabinets'],
  epoxy: ['Garage Floor', 'Basement', 'Commercial'],
  kitchen_bath: ['Kitchen', 'Bath', 'Kitchen & Bath'],
  reno: ['Full Home', 'Addition', 'Basement', 'Room Remodel'],
};

export default function LeadFieldOptionsTab({ settings, onSave }) {
  const [saving, setSaving] = useState(false);
  const [sizes, setSizes] = useState(DEFAULT_PROJECT_SIZES);
  const [types, setTypes] = useState(DEFAULT_PROJECT_TYPES);
  const [newSize, setNewSize] = useState('');
  const [newType, setNewType] = useState({});

  useEffect(() => {
    if (settings) {
      if (settings.project_sizes?.length) setSizes(settings.project_sizes);
      if (settings.project_types_by_industry && Object.keys(settings.project_types_by_industry).length) {
        setTypes(prev => ({ ...prev, ...settings.project_types_by_industry }));
      }
    }
  }, [settings]);

  const addSize = () => {
    const v = newSize.trim();
    if (!v || sizes.includes(v)) return;
    setSizes(prev => [...prev, v]);
    setNewSize('');
  };

  const removeSize = (i) => setSizes(prev => prev.filter((_, idx) => idx !== i));

  const addType = (industry) => {
    const v = (newType[industry] || '').trim();
    if (!v || (types[industry] || []).includes(v)) return;
    setTypes(prev => ({ ...prev, [industry]: [...(prev[industry] || []), v] }));
    setNewType(prev => ({ ...prev, [industry]: '' }));
  };

  const removeType = (industry, i) => {
    setTypes(prev => ({
      ...prev,
      [industry]: (prev[industry] || []).filter((_, idx) => idx !== i),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      project_sizes: sizes,
      project_types_by_industry: types,
    });
    setSaving(false);
    toast({ title: 'Saved', description: 'Lead field options updated.' });
  };

  return (
    <div className="space-y-6">
      {/* Project Sizes */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-bold text-white mb-1">Project Sizes</h2>
        <p className="text-xs text-slate-400 mb-4">These options appear on every lead regardless of industry.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {sizes.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200">
              {s}
              <button onClick={() => removeSize(i)} className="text-slate-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
            placeholder="Add new size..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          />
          <button onClick={addSize} className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Types by Industry */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-bold text-white mb-1">Project Types by Industry</h2>
        <p className="text-xs text-slate-400 mb-4">Options are filtered based on the lead's industry. If a lead has no industry, all options are shown.</p>
        <div className="space-y-5">
          {Object.entries(INDUSTRY_META).map(([key, meta]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${meta.color}`}>{meta.label}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(types[key] || []).map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 border border-slate-600 rounded-md text-xs text-slate-200">
                    {t}
                    <button onClick={() => removeType(key, i)} className="text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {(!types[key] || types[key].length === 0) && (
                  <span className="text-xs text-slate-500 italic">No options defined</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newType[key] || ''}
                  onChange={(e) => setNewType(prev => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addType(key))}
                  placeholder={`Add ${meta.label} type...`}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
                />
                <button onClick={() => addType(key)} className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 text-black disabled:opacity-50"
        style={{ backgroundColor: '#D6FF03' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Options'}
      </button>
    </div>
  );
}