import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X, FileText, Save, Megaphone, ShieldCheck, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SUB_TABS = [
  { id: 'tone', label: 'Tone', icon: Megaphone },
  { id: 'rules', label: 'Rules', icon: ShieldCheck },
  { id: 'context', label: 'Context', icon: BookOpen },
  { id: 'sops', label: 'SOPs', icon: FileText },
];

export default function AICoachSettingsTab() {
  const [subTab, setSubTab] = useState('tone');
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toneRef = useRef(null);
  const rulesRef = useRef(null);
  const contextRef = useRef(null);

  const [tone, setTone] = useState('');
  const [rules, setRules] = useState('');
  const [context, setContext] = useState('');
  const [sopUrls, setSopUrls] = useState([]);
  const [sopNames, setSopNames] = useState([]);

  useEffect(() => {
    setLoading(true);
    base44.entities.CompanySettings.filter({ key: 'ai_coach' }).then(results => {
      if (results.length > 0) {
        const s = results[0];
        setSettingsId(s.id);
        setTone(s.ai_coach_tone || '');
        setRules(s.ai_coach_rules || '');
        setContext(s.ai_coach_context || s.ai_coach_instructions || '');
        setSopUrls(s.ai_coach_sop_urls || []);
        setSopNames(s.ai_coach_sop_names || []);
      }
      setLoading(false);
    });
  }, []);

  const handleUploadSOP = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSopUrls(prev => [...prev, file_url]);
    setSopNames(prev => [...prev, file.name]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSOP = (index) => {
    setSopUrls(prev => prev.filter((_, i) => i !== index));
    setSopNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ai_coach_tone: toneRef.current?.value || '',
      ai_coach_rules: rulesRef.current?.value || '',
      ai_coach_context: contextRef.current?.value || '',
      ai_coach_instructions: contextRef.current?.value || '',
      ai_coach_sop_urls: sopUrls,
      ai_coach_sop_names: sopNames,
    };
    if (settingsId) {
      await base44.entities.CompanySettings.update(settingsId, payload);
    } else {
      await base44.entities.CompanySettings.create({ key: 'ai_coach', ...payload });
    }
    setSaving(false);
    toast({ title: 'Saved', description: 'AI coach settings updated.' });
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
        <h2 className="text-sm font-bold text-white">AI Setter Coach</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure how the daily AI coach messages sound and what they reference.</p>
      </div>

      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {SUB_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                subTab === t.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5">
        {subTab === 'tone' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">How should the AI coach sound?</p>
            <textarea
              ref={toneRef}
              defaultValue={tone}
              placeholder="e.g. Motivational and high-energy, like a sports coach. Use slang. Keep it short and punchy."
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] min-h-[120px]"
            />
            <div className="flex flex-wrap gap-1.5">
              {['Motivational & high-energy', 'Direct & no-nonsense', 'Friendly & supportive', 'Competitive & fired-up'].map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    if (toneRef.current) {
                      toneRef.current.value = toneRef.current.value ? `${toneRef.current.value}. ${preset}.` : preset;
                    }
                  }}
                  className="px-2 py-1 text-[11px] rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-[#D6FF03]/40 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        )}
        {subTab === 'rules' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Hard rules the AI must follow. These override everything else.</p>
            <textarea
              ref={rulesRef}
              defaultValue={rules}
              placeholder={"e.g.\n- Never tell setters to make a specific number of calls\n- Always mention speed-to-lead\n- Keep messages under 3 sentences"}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] min-h-[140px]"
            />
          </div>
        )}
        {subTab === 'context' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Company-specific context the AI should know.</p>
            <textarea
              ref={contextRef}
              defaultValue={context}
              placeholder="e.g. We're a home services lead gen agency. Our setters call leads within 5 minutes."
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] min-h-[140px]"
            />
          </div>
        )}
        {subTab === 'sops' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Upload setter SOPs or playbooks. The AI will reference these when coaching.</p>
            <div className="space-y-2">
              {sopNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-[#D6FF03] flex-shrink-0" />
                  <span className="text-sm text-slate-200 truncate flex-1">{name}</span>
                  <button onClick={() => removeSOP(i)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleUploadSOP} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-2.5 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-[#D6FF03]/40 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload SOP File'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 text-black disabled:opacity-50"
        style={{ backgroundColor: '#D6FF03' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Coach Settings'}
      </button>
    </div>
  );
}