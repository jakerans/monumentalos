import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check, MessageCircle } from 'lucide-react';

const DEFAULT_TEMPLATE = `Awesome, I've booked your appointment with {{estimator_name}}. Their phone number is {{estimator_phone}}. If you need to make any changes to your appointment, please reach out to them directly, as I won't be able to help you here.`;

function renderTemplate(template, vars) {
  let result = template || DEFAULT_TEMPLATE;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`);
  }
  return result;
}

export default function MessengerBookedPopup({ open, onOpenChange, client, appointmentDate, onDone }) {
  const [copied, setCopied] = useState(false);

  const { data: templateSetting } = useQuery({
    queryKey: ['messenger-template-setting'],
    queryFn: async () => {
      const results = await base44.entities.CompanySettings.filter({ key: 'messenger_confirmation' });
      return results[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const message = useMemo(() => {
    const dateStr = appointmentDate
      ? new Date(appointmentDate).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      : '';
    const template = templateSetting?.messenger_template || DEFAULT_TEMPLATE;
    return renderTemplate(template, {
      estimator_name: client?.estimator_name || '[Estimator Name]',
      estimator_phone: client?.estimator_phone || '[Estimator Phone]',
      appointment_date: dateStr,
      client_name: client?.name || '',
    });
  }, [client, appointmentDate, templateSetting]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDone(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Send Booking Confirmation
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500 -mt-1">Copy this message and send it to the lead on Messenger:</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {message}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Message'}
          </button>
          <button
            onClick={handleDone}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}