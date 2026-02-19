import React from 'react';

export default function ExpenseTabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
            <div className="h-2.5 w-16 bg-slate-700 rounded mb-2" />
            <div className="h-6 w-24 bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <div className="h-3 w-20 bg-slate-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-16 bg-slate-700 rounded" />
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full" />
              <div className="h-4 w-14 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters placeholder */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-28 bg-slate-700 rounded" />
        <div className="h-7 w-24 bg-slate-700 rounded" />
        <div className="flex-1" />
        <div className="h-7 w-24 bg-slate-700 rounded" />
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="border-b border-slate-700/50 px-3 py-2 flex gap-6">
          {[60, 50, 40, 100, 50, 50, 50].map((w, i) => (
            <div key={i} className={`h-3 bg-slate-700 rounded`} style={{ width: `${w}px` }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border-b border-slate-700/30 px-3 py-3 flex items-center gap-6">
            <div className="h-3 w-16 bg-slate-700/60 rounded" />
            <div className="h-4 w-14 bg-slate-700/60 rounded" />
            <div className="h-4 w-10 bg-slate-700/60 rounded" />
            <div className="h-3 w-28 bg-slate-700/60 rounded" />
            <div className="h-3 w-16 bg-slate-700/60 rounded" />
            <div className="h-3 w-12 bg-slate-700/60 rounded" />
            <div className="h-3 w-14 bg-slate-700/60 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}