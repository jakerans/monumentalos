import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Sparkles } from 'lucide-react';

const DEFAULT_CATEGORIES = ['ad_spend', 'payroll', 'software', 'office', 'contractor', 'travel', 'other'];
const DEFAULT_TYPES = ['cogs', 'overhead', 'distribution'];

export default function AIExpenseSettingsModal({ open, onOpenChange }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [instructions, setInstructions] = useState('');
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const all = await base44.entities.CompanySettings.filter({ key: 'ai_expense' });
      if (all.length > 0) {
        const s = all[0];
        setSettingsId(s.id);
        if (s.allowed_expense_categories?.length) setCategories(s.allowed_expense_categories);
        if (s.allowed_expense_types?.length) setTypes(s.allowed_expense_types);
        if (s.ai_custom_instructions) setInstructions(s.ai_custom_instructions);
      } else {
        setSettingsId(null);
        setCategories(DEFAULT_CATEGORIES);
        setTypes(DEFAULT_TYPES);
        setInstructions('');
      }
      setLoading(false);
    };
    load();
  }, [open]);

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
    toast({ title: 'AI Expense Settings Saved' });
    setSaving(false);
    onOpenChange(false);
  };

  const addCategory = () => {
    const val = newCat.trim().toLowerCase().replace(/\s+/g, '_');
    if (val && !categories.includes(val)) {
      setCategories([...categories, val]);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-[#D6FF03]" />
            AI Expense Categorization Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading settings...</div>
        ) : (
          <div className="space-y-5">
            {/* Allowed Categories */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Allowed Categories</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categories.map(cat => (
                  <span key={cat} className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                    {cat.replace(/_/g, ' ')}
                    <button onClick={() => removeCategory(cat)} className="text-slate-500 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="Add category..."
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
                />
                <button onClick={addCategory} className="px-2 py-1.5 text-xs bg-slate-700 text-white rounded-md hover:bg-slate-600">
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
                      types.includes(t)
                        ? 'bg-[#D6FF03]/15 border-[#D6FF03]/40 text-[#D6FF03]'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
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
                rows={4}
                placeholder="e.g. 'Always categorize Meta/Facebook charges as ad_spend. Stripe fees should be software. Any payment to John Doe is contractor.'"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => onOpenChange(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs font-medium bg-[#D6FF03] text-black rounded-md hover:bg-[#c5eb02] disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}