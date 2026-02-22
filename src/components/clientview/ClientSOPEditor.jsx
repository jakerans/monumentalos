import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Save, Info, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * Pure-DOM SOP editor. React never re-renders during typing.
 * All textarea values are read directly from DOM on save.
 */
export default function ClientSOPEditor({ clientId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const csRef = useRef(null);
  const faqRef = useRef(null);
  const tpRef = useRef(null);
  const gnRef = useRef(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      const res = await base44.functions.invoke('manageClientSOP', { action: 'get', client_id: clientId });
      if (cancelled) return;
      const sop = res.data?.sop;
      if (sop) {
        if (csRef.current) csRef.current.value = sop.call_script || '';
        if (faqRef.current) faqRef.current.value = sop.faqs || '';
        if (tpRef.current) tpRef.current.value = sop.talking_points || '';
        if (gnRef.current) gnRef.current.value = sop.general_notes || '';
        setLastUpdated(sop.last_updated || null);
        setIsNew(false);
      } else {
        setIsNew(true);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    const res = await base44.functions.invoke('manageClientSOP', {
      action: 'save',
      client_id: clientId,
      call_script: csRef.current?.value || '',
      faqs: faqRef.current?.value || '',
      talking_points: tpRef.current?.value || '',
      general_notes: gnRef.current?.value || '',
    });
    setLastUpdated(res.data?.sop?.last_updated || new Date().toISOString());
    setIsNew(false);
    setSaving(false);
    toast({ title: 'SOP Saved', description: 'Client SOP has been updated.' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="ml-2 text-sm text-slate-400">Loading SOP...</span>
      </div>
    );
  }

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

      <SOPField label="Call Script" inputRef={csRef} rows={12} />
      <SOPField label="FAQs" inputRef={faqRef} rows={8} />
      <SOPField label="Talking Points" inputRef={tpRef} rows={8} />
      <SOPField label="General Notes" inputRef={gnRef} rows={6} />

      <div className="flex items-center justify-between pt-2">
        <div>
          {lastUpdated && (
            <p className="text-[11px] text-slate-500">
              Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#D6FF03' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save SOP
        </button>
      </div>
    </div>
  );
}

function SOPField({ label, inputRef, rows }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-1.5">{label}</label>
      <textarea
        ref={inputRef}
        defaultValue=""
        rows={rows}
        className="w-full px-3 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03] resize-y"
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
      <p className="text-[10px] text-slate-500 mt-1">Supports markdown</p>
    </div>
  );
}