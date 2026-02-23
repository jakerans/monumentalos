import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Save, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const DEFAULT_CATEGORIES = ['ad_spend', 'payroll', 'software', 'office', 'contractor', 'travel', 'other'];
const DEFAULT_TYPES = ['cogs', 'overhead', 'distribution'];

export default function AIExpenseSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [instructions, setInstructions] = useState('');
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await base44.entities.CompanySettings.filter({ key: 'ai_expense' });
      if (all.length > 0) {
        const s = all[0];
        setSettingsId(s.id);
        if (s.allowed_expense_categories?.length) setCategories(s.allowed_expense_categories);
        if (s.allowed_expense_types?.length) setTypes(s.allowed_expense_types);
        if (s.ai_custom_instructions) setInstructions(s.ai_custom_instructions);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      key: 'ai_expense',
      allowed_expense_categories: categories,
      allowed_expense_types: types,
      ai_custom_instructions: instructions,
    };
    if (settingsId) {
      await base44.entities.CompanySettings.update(settingsId, data);
    } else {
      await base44.entities.CompanySettings.create(data);
    }
    toast({ title: 'Saved', description: 'AI expense settings updated.' });
    setSaving(false);
  };

  const addCategory = () => {
    const val = newCat.trim().toLowerCase().replace(/\s+/g, '_');
    if (val && !categories.includes(val)) setCategories([...categories, val]);
    setNewCat('');
  };

  const removeCategory = (cat) => setCategories(categories.filter(c => c !== cat));
  const toggleType = (t) => {
    if (types.includes(t)) {
      if (types.length <= 1) return;
      setTypes(types.filter(x => x !== t));
    } else {
      setTypes([...types, t]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#D6FF03] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">AI Expense Categorization</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure which categories and types the AI can assign to expenses.</p>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5 space-y-5">
        {/* Allowed Categories */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Allowed Categories</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categories.map(cat => (
              <span key={cat} className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 border border-slate-600 rounded-md text-slate-300">
                {cat.replace(/_/g, ' ')}
                <button onClick={() => removeCategory(cat)} className="text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="Add category..."
              className="flex-1 px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
            />
            <button onClick={addCategory} className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Allowed Types */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Allowed Expense Types</label>
          <div className="flex gap-2">
            {['cogs', 'overhead', 'distribution'].map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  types.includes(t) ? 'bg-[#D6FF03]/15 border-[#D6FF03]/40 text-[#D6FF03]' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Custom AI Instructions</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={12}
            placeholder="e.g. 'Always categorize Meta/Facebook charges as ad_spend. Stripe fees should be software.'"
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 text-black disabled:opacity-50"
        style={{ backgroundColor: '#D6FF03' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Expense Settings'}
      </button>
    </div>
  );
}