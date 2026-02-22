import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Save, Info, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * Each textarea manages its OWN local state so typing never waits
 * on the parent to re-render. The parent value is only read on mount /
 * when the parent pushes a brand-new value (key-based reset).
 */
const sopTextareaStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  lineHeight: '1.5',
  border: '1px solid rgb(51, 65, 85)',
  borderRadius: '8px',
  backgroundColor: 'rgb(30, 41, 59)',
  color: 'white',
  resize: 'vertical',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const SOPTextarea = memo(function SOPTextarea({ label, initialValue, onCommit, minRows = 8 }) {
  const localRef = useRef(initialValue || '');
  const textareaRef = useRef(null);

  // Sync on parent reset
  useEffect(() => {
    localRef.current = initialValue || '';
    if (textareaRef.current) {
      textareaRef.current.value = initialValue || '';
    }
  }, [initialValue]);

  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '6px' }}>{label}</label>
      <textarea
        ref={textareaRef}
        defaultValue={initialValue || ''}
        onChange={(e) => { localRef.current = e.target.value; }}
        onBlur={() => onCommit(localRef.current)}
        rows={minRows}
        style={sopTextareaStyle}
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
      <p style={{ fontSize: '10px', color: 'rgb(100, 116, 139)', marginTop: '4px' }}>Supports markdown (headers, bold, bullets, numbered lists)</p>
    </div>
  );
});

function ClientSOPEditorInner({ clientId }) {
  // Use refs for the "committed" values so we never re-render children on every keystroke
  const callScriptRef = useRef('');
  const faqsRef = useRef('');
  const talkingPointsRef = useRef('');
  const generalNotesRef = useRef('');

  const [lastUpdated, setLastUpdated] = useState(null);
  const [initialized, setInitialized] = useState(false);
  // A counter we bump to force textarea reset when data loads
  const [resetKey, setResetKey] = useState(0);
  const [initValues, setInitValues] = useState({ cs: '', faq: '', tp: '', gn: '' });

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
      const cs = data.call_script || '';
      const faq = data.faqs || '';
      const tp = data.talking_points || '';
      const gn = data.general_notes || '';
      callScriptRef.current = cs;
      faqsRef.current = faq;
      talkingPointsRef.current = tp;
      generalNotesRef.current = gn;
      setInitValues({ cs, faq, tp, gn });
      setLastUpdated(data.last_updated || null);
      setInitialized(true);
      setResetKey(k => k + 1);
    } else if (data === null && !initialized) {
      setInitialized(true);
    }
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('manageClientSOP', {
        action: 'save',
        client_id: clientId,
        call_script: callScriptRef.current,
        faqs: faqsRef.current,
        talking_points: talkingPointsRef.current,
        general_notes: generalNotesRef.current,
      });
      return res.data;
    },
    onSuccess: (res) => {
      setLastUpdated(res.sop?.last_updated || new Date().toISOString());
      toast({ title: 'SOP Saved', description: 'Client SOP has been updated.' });
    },
  });

  const commitCS = useCallback((v) => { callScriptRef.current = v; }, []);
  const commitFAQ = useCallback((v) => { faqsRef.current = v; }, []);
  const commitTP = useCallback((v) => { talkingPointsRef.current = v; }, []);
  const commitGN = useCallback((v) => { generalNotesRef.current = v; }, []);

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

      <SOPTextarea key={`cs-${resetKey}`} label="Call Script" initialValue={initValues.cs} onCommit={commitCS} minRows={12} />
      <SOPTextarea key={`faq-${resetKey}`} label="FAQs" initialValue={initValues.faq} onCommit={commitFAQ} minRows={8} />
      <SOPTextarea key={`tp-${resetKey}`} label="Talking Points" initialValue={initValues.tp} onCommit={commitTP} minRows={8} />
      <SOPTextarea key={`gn-${resetKey}`} label="General Notes" initialValue={initValues.gn} onCommit={commitGN} minRows={6} />

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