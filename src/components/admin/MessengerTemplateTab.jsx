import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { Save, MessageCircle, RotateCcw } from 'lucide-react';

const DEFAULT_TEMPLATE = `Awesome, I've booked your appointment with {{estimator_name}}. Their phone number is {{estimator_phone}}. If you need to make any changes to your appointment, please reach out to them directly, as I won't be able to help you here.`;

const PLACEHOLDERS = [
  { tag: '{{estimator_name}}', desc: "Client's estimator name" },
  { tag: '{{estimator_phone}}', desc: "Client's estimator phone" },
  { tag: '{{appointment_date}}', desc: 'Formatted appointment date & time' },
  { tag: '{{client_name}}', desc: 'Client company name' },
];

export default function MessengerTemplateTab() {
  const queryClient = useQueryClient();
  const { data: setting, isLoading } = useQuery({
    queryKey: ['messenger-template-setting'],
    queryFn: async () => {
      const results = await base44.entities.CompanySettings.filter({ key: 'messenger_confirmation' });
      return results[0] || null;
    },
  });

  const [template, setTemplate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTemplate(setting?.messenger_template || DEFAULT_TEMPLATE);
    }
  }, [setting, isLoading]);

  const handleSave = async () => {
    setSaving(true);
    if (setting?.id) {
      await base44.entities.CompanySettings.update(setting.id, { messenger_template: template });
    } else {
      await base44.entities.CompanySettings.create({ key: 'messenger_confirmation', messenger_template: template });
    }
    queryClient.invalidateQueries({ queryKey: ['messenger-template-setting'] });
    toast({ title: 'Messenger template saved' });
    setSaving(false);
  };

  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATE);
  };

  // Live preview
  const preview = template
    .replace(/\{\{estimator_name\}\}/g, 'John Smith')
    .replace(/\{\{estimator_phone\}\}/g, '(555) 123-4567')
    .replace(/\{\{appointment_date\}\}/g, 'Monday, March 3, 10:00 AM')
    .replace(/\{\{client_name\}\}/g, 'ABC Remodeling');

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-base font-bold text-white">Messenger Booking Confirmation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            This message is shown to setters after they book a Messenger lead, so they can copy & paste it to the lead.
          </p>
        </div>
      </div>

      {/* Placeholders reference */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Available Placeholders</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PLACEHOLDERS.map(p => (
            <div key={p.tag} className="flex items-center gap-2 text-xs">
              <code className="px-1.5 py-0.5 bg-slate-700 text-[#D6FF03] rounded text-[11px] font-mono">{p.tag}</code>
              <span className="text-slate-400">{p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Template editor */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Message Template</label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#D6FF03]/50 leading-relaxed"
          placeholder="Enter your messenger booking confirmation message..."
        />
      </div>

      {/* Live preview */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">Live Preview</p>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-100 whitespace-pre-wrap leading-relaxed">
          {preview}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-black hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#D6FF03' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Template'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>
    </div>
  );
}