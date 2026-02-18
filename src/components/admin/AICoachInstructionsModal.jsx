import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Upload, X, FileText, Sparkles, ShieldCheck, BookOpen, Megaphone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const TABS = [
  { id: 'tone', label: 'Tone', icon: Megaphone },
  { id: 'rules', label: 'Rules', icon: ShieldCheck },
  { id: 'context', label: 'Context', icon: BookOpen },
  { id: 'sops', label: 'SOPs', icon: FileText },
];

export default function AICoachInstructionsModal({ open, onOpenChange }) {
  const [tab, setTab] = useState('tone');
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [tone, setTone] = useState('');
  const [rules, setRules] = useState('');
  const [context, setContext] = useState('');
  const [sopUrls, setSopUrls] = useState([]);
  const [sopNames, setSopNames] = useState([]);

  useEffect(() => {
    if (!open) return;
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
      } else {
        setSettingsId(null);
        setTone('');
        setRules('');
        setContext('');
        setSopUrls([]);
        setSopNames([]);
      }
      setLoading(false);
    });
  }, [open]);

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
      ai_coach_tone: tone,
      ai_coach_rules: rules,
      ai_coach_context: context,
      ai_coach_instructions: context, // keep legacy field synced
      ai_coach_sop_urls: sopUrls,
      ai_coach_sop_names: sopNames,
    };
    if (settingsId) {
      await base44.entities.CompanySettings.update(settingsId, payload);
    } else {
      await base44.entities.CompanySettings.create({ key: 'ai_coach', ...payload });
    }
    setSaving(false);
    toast({ title: 'Saved', description: 'AI coach settings updated. Setters will see the change tomorrow.' });
    onOpenChange(false);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#D6FF03] animate-spin" />
        </div>
      );
    }

    switch (tab) {
      case 'tone':
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">How should the AI coach sound? This sets the overall vibe of every message.</p>
            <Textarea
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. Motivational and high-energy, like a sports coach. Use slang. Keep it short and punchy. Don't be cheesy."
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 min-h-[120px]"
            />
            <div className="flex flex-wrap gap-1.5">
              {['Motivational & high-energy', 'Direct & no-nonsense', 'Friendly & supportive', 'Competitive & fired-up'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setTone(prev => prev ? `${prev}. ${preset}.` : preset)}
                  className="px-2 py-1 text-[11px] rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-[#D6FF03]/40 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Hard rules the AI must follow. These override everything else.</p>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={"e.g.\n- Never tell setters to make a specific number of calls\n- Always mention speed-to-lead\n- Don't reference specific lead names\n- Keep messages under 3 sentences"}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 min-h-[140px]"
            />
          </div>
        );

      case 'context':
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Company-specific context the AI should know — values, terminology, processes, what matters most to your team.</p>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={"e.g. We're a home services lead gen agency. Our setters call leads within 5 minutes. We value speed-to-lead above all else. Our clients are painters, remodelers, and epoxy companies."}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 min-h-[140px]"
            />
          </div>
        );

      case 'sops':
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Upload setter SOPs or playbooks. The AI will reference these when coaching. Supports PDF, DOCX, TXT, images.</p>
            <div className="space-y-2">
              {sopNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-[#D6FF03] flex-shrink-0" />
                  <span className="text-sm text-slate-200 truncate flex-1">{name}</span>
                  <button onClick={() => removeSOP(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleUploadSOP}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-[#D6FF03]/40 bg-transparent"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload SOP File'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D6FF03]" />
            AI Coach Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  tab === t.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[180px]">
          {renderTabContent()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-[#D6FF03] text-black hover:bg-[#c2eb00]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}