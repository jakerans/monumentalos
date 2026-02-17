import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#D6FF03] animate-spin" />
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}