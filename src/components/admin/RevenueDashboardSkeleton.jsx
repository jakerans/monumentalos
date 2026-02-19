import React from 'react';

function Pulse({ className }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />;
}

function KPICard() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Pulse className="w-6 h-6 rounded-lg" />
        <Pulse className="h-2.5 w-16" />
      </div>
      <Pulse className="h-5 w-20" />
      <Pulse className="h-2 w-12" />
    </div>
  );
}

function ChartCard({ height = 'h-[280px]' }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-3">
      <Pulse className="h-4 w-48" />
      <Pulse className={`w-full ${height} rounded-lg`} />
    </div>
  );
}

function LedgerCard() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <Pulse className="h-4 w-28" />
        <Pulse className="h-4 w-20" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center justify-between border-b border-slate-700/30">
            <div className="space-y-1">
              <Pulse className="h-3 w-28" />
              <Pulse className="h-2 w-40" />
            </div>
            <Pulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RevenueDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Nav placeholder */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-5 gap-4">
        <Pulse className="h-5 w-32" />
        <div className="flex gap-3 ml-8">
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Pulse className="h-6 w-36" />
            <Pulse className="h-3 w-56" />
          </div>
          <Pulse className="h-9 w-56 rounded-lg" />
        </div>

        {/* Tab bar + action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            <Pulse className="h-7 w-16 rounded-md" />
            <Pulse className="h-7 w-20 rounded-md" />
            <Pulse className="h-7 w-16 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Pulse className="h-7 w-32 rounded-md" />
            <Pulse className="h-7 w-28 rounded-md" />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {Array.from({ length: 9 }).map((_, i) => <KPICard key={i} />)}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard />
          <ChartCard />
        </div>

        {/* Ledgers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LedgerCard />
          <LedgerCard />
        </div>
      </main>
    </div>
  );
}