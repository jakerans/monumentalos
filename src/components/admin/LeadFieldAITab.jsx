import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Loader2, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function LeadFieldAITab({ settings, onSave }) {
  const [saving, setSaving] = useState(false);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (settings?.ai_lead_classify_instructions) {
      setInstructions(settings.ai_lead_classify_instructions);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ai_lead_classify_instructions: instructions });
    setSaving(false);
    toast({ title: 'Saved', description: 'AI classification instructions updated.' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D6FF03]" />
            AI Lead Auto-Classification
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            An AI agent runs once daily and scans all leads that are missing a project type or project size. It reads the lead's name, notes, industry, ad name, and other details to guess the best matching option. It will <strong className="text-slate-300">never</strong> create new options — only select from the ones you've defined.
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg border border-slate-700/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Info className="w-3.5 h-3.5" />
            <span className="font-medium">How it works</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 ml-5 list-disc">
            <li>Runs once per day at 6:00 AM ET</li>
            <li>Only processes leads where project_type or project_size is blank</li>
            <li>Uses the lead's industry to pick from the correct project type list</li>
            <li>Picks the closest matching project size from your defined options</li>
            <li>If unsure, it leaves the field blank rather than guessing wrong</li>
          </ul>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Custom Instructions for the AI</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"e.g.\n- If a lead mentions 'whole house' or 'full home', set size to 'Full Project'\n- Painting leads that mention 'cabinets' should be type 'Cabinets'\n- Kitchen leads always default to 'Kitchen' unless notes say 'bathroom'\n- If lead source is 'agency', lean towards 'Full Project' for size"}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] min-h-[180px]"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">These instructions are sent to the AI along with the available options. Be specific about edge cases.</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 text-black disabled:opacity-50"
        style={{ backgroundColor: '#D6FF03' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Instructions'}
      </button>
    </div>
  );
}