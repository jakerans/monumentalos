import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AICoachInstructionsModal({ open, onOpenChange }) {
  const [instructions, setInstructions] = useState('');
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.entities.CompanySettings.filter({ key: 'ai_coach' }).then(results => {
      if (results.length > 0) {
        setSettingsId(results[0].id);
        setInstructions(results[0].ai_coach_instructions || '');
      } else {
        setSettingsId(null);
        setInstructions('');
      }
      setLoading(false);
    });
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await base44.entities.CompanySettings.update(settingsId, {
        ai_coach_instructions: instructions,
      });
    } else {
      await base44.entities.CompanySettings.create({
        key: 'ai_coach',
        ai_coach_instructions: instructions,
      });
    }
    setSaving(false);
    toast({ title: 'Saved', description: 'AI coach instructions updated. Setters will see the change tomorrow.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">AI Coach Instructions</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-400 -mt-2">
          These instructions are included in the daily AI message prompt for all setters. Use this to give company-specific context, tone, or rules.
        </p>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#D6FF03] animate-spin" />
          </div>
        ) : (
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Never tell setters to make a specific number of calls. Focus on speed-to-lead and booking quality. Our company values are..."
            className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 min-h-[160px]"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-[#D6FF03] text-black hover:bg-[#c2eb00]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}