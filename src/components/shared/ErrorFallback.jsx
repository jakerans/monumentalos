import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4">
      <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 mb-4">
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}