import React from 'react';

function Pulse({ className }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />;
}

function KPICardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <Pulse className="h-3 w-20 mb-2" />
      <Pulse className="h-7 w-14 mb-1" />
      <Pulse className="h-2 w-24" />
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Pulse className="h-4 w-32" />
        <Pulse className="h-5 w-16 rounded-full" />
      </div>
      <Pulse className="h-3 w-24" />
      <Pulse className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Pulse className="h-3 w-20" />
        <Pulse className="h-3 w-12" />
      </div>
    </div>
  );
}

export default function OnboardDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
      {/* Nav skeleton */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <Pulse className="h-5 w-32" />
        <div className="flex items-center gap-3">
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
        </div>
        <Pulse className="h-4 w-20" />
      </div>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-5 py-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>

        {/* Filters + actions bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-7 w-16 rounded-md" />
            ))}
          </div>
          <div className="flex gap-2">
            <Pulse className="h-7 w-24 rounded-md" />
            <Pulse className="h-7 w-28 rounded-md" />
            <Pulse className="h-7 w-36 rounded-md" />
          </div>
        </div>

        {/* Project cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}