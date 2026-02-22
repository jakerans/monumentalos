import React, { useState, useEffect, useCallback, memo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Save, Info, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SOPTextarea = memo(function SOPTextarea({ label, value, onChange, minRows = 8 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        className="w-full px-3 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] resize-y"
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
      <p className="text-[10px] text-slate-500 mt-1">Supports markdown (headers, bold, bullets, numbered lists)</p>
    </div>
  );
});

function ClientSOPEditorInner({ clientId }) {
  const [callScript, setCallScript] = useState('');
  const [faqsText, setFaqsText] = useState('');
  const [talkingPoints, setTalkingPoints] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['client-sop', clientId],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageClientSOP', { action: 'get', client_id: clientId });
      return res.data?.sop || null;
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (data && !initialized) {
      setCallScript(data.call_script || '');
      setFaqsText(data.faqs || '');
      setTalkingPoints(data.talking_points || '');
      setGeneralNotes(data.general_notes || '');
      setLastUpdated(data.last_updated || null);
      setInitialized(true);
    } else if (data === null && !initialized) {
      setInitialized(true);
    }
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('manageClientSOP', {
        action: 'save',
        client_id: clientId,
        call_script: callScript,
        faqs: faqsText,
        talking_points: talkingPoints,
        general_notes: generalNotes,
      });
      return res.data;
    },
    onSuccess: (res) => {
      setLastUpdated(res.sop?.last_updated || new Date().toISOString());
      toast({ title: 'SOP Saved', description: 'Client SOP has been updated.' });
    },
  });

  const onCallScriptChange = useCallback((v) => setCallScript(v), []);
  const onFaqsChange = useCallback((v) => setFaqsText(v), []);
  const onTalkingPointsChange = useCallback((v) => setTalkingPoints(v), []);
  const onGeneralNotesChange = useCallback((v) => setGeneralNotes(v), []);

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="ml-2 text-sm text-slate-400">Loading SOP...</span>
      </div>
    );
  }

  const isNew = data === null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4.5 h-4.5 text-[#D6FF03]" />
        <h3 className="text-base font-bold text-white">Standard Operating Procedures</h3>
      </div>

      {isNew && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">No SOP has been created for this client yet. Fill in the fields below and save.</p>
        </div>
      )}

      <SOPTextarea label="Call Script" value={callScript} onChange={onCallScriptChange} minRows={12} />
      <SOPTextarea label="FAQs" value={faqsText} onChange={onFaqsChange} minRows={8} />
      <SOPTextarea label="Talking Points" value={talkingPoints} onChange={onTalkingPointsChange} minRows={8} />
      <SOPTextarea label="General Notes" value={generalNotes} onChange={onGeneralNotesChange} minRows={6} />

      <div className="flex items-center justify-between pt-2">
        <div>
          {lastUpdated && (
            <p className="text-[11px] text-slate-500">
              Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#D6FF03' }}
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save SOP
        </button>
      </div>
    </div>
  );
}

const ClientSOPEditor = memo(ClientSOPEditorInner);
export default ClientSOPEditor;