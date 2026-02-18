import React from 'react';

function Pulse({ className }) {
  return <div className={`bg-slate-700/40 rounded-lg animate-pulse ${className}`} />;
}

function KPICardSkeleton({ delay }) {
  return (
    <div
      className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 space-y-2.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <Pulse className="w-7 h-7 rounded-md" />
        <Pulse className="h-3 w-16 rounded" />
      </div>
      <Pulse className="h-6 w-14 rounded" />
      <Pulse className="h-2.5 w-20 rounded" />
    </div>
  );
}

function ChartCardSkeleton({ children }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Pulse className="w-4 h-4 rounded" />
        <Pulse className="h-3.5 w-32 rounded" />
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Nav placeholder */}
      <div className="sticky top-0 z-50 bg-slate-900/80 border-b border-slate-800 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Pulse className="h-5 w-28 rounded" />
          <div className="flex items-center gap-3">
            {[...Array(6)].map((_, i) => (
              <Pulse key={i} className="h-4 w-16 rounded" />
            ))}
          </div>
          <Pulse className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Pulse className="h-7 w-52 rounded" />
            <Pulse className="h-4 w-36 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Pulse className="h-9 w-28 rounded-lg" />
            <Pulse className="h-9 w-32 rounded-lg" />
            <Pulse className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* KPI row — 8 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <KPICardSkeleton key={i} delay={i * 60} />
          ))}
        </div>

        {/* Charts row — 3 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Donut chart skeleton */}
          <ChartCardSkeleton>
            <div className="flex items-center gap-4 flex-1">
              <Pulse className="w-28 h-28 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Pulse className="h-2.5 w-20 rounded" />
                      <Pulse className="h-2.5 w-6 rounded" />
                    </div>
                    <Pulse className="h-1 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </ChartCardSkeleton>

          {/* Revenue donut skeleton */}
          <ChartCardSkeleton>
            <div className="flex items-center gap-4 flex-1">
              <Pulse className="w-28 h-28 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Pulse className="h-2.5 w-24 rounded" />
                      <Pulse className="h-2.5 w-14 rounded" />
                    </div>
                    <Pulse className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </ChartCardSkeleton>

          {/* Goal progress skeleton */}
          <ChartCardSkeleton>
            <div className="flex items-center justify-center mb-3">
              <Pulse className="w-24 h-24 rounded-full" />
            </div>
            <div className="space-y-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Pulse className="h-3 w-24 rounded" />
                  <Pulse className="h-2 flex-1 rounded-full" />
                  <Pulse className="h-3 w-12 rounded" />
                </div>
              ))}
            </div>
          </ChartCardSkeleton>
        </div>

        {/* P&L Snapshot */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <Pulse className="h-4 w-56 rounded mb-4" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Pulse className="h-2.5 w-16 rounded" />
                <Pulse className="h-5 w-20 rounded" />
                <Pulse className="h-2.5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row: Stat compare + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stat compare */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Pulse className="w-7 h-7 rounded-lg" />
              <Pulse className="h-3.5 w-36 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-2.5 space-y-1.5">
                  <Pulse className="h-2.5 w-12 rounded mx-auto" />
                  <Pulse className="h-5 w-16 rounded mx-auto" />
                </div>
              ))}
            </div>
            <Pulse className="h-28 w-full rounded" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Pulse className="h-3 w-14 rounded" />
                  <Pulse className="h-5 flex-1 rounded-full" />
                  <Pulse className="h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
              <Pulse className="w-4 h-4 rounded" />
              <Pulse className="h-3.5 w-40 rounded" />
            </div>
            <div className="px-4 py-1.5 border-b border-slate-700/30 flex justify-between">
              <Pulse className="h-2 w-10 rounded" />
              <div className="flex gap-3">
                <Pulse className="h-2 w-8 rounded" />
                <Pulse className="h-2 w-12 rounded" />
              </div>
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between border-b border-slate-700/20 last:border-0">
                <div className="flex items-center gap-2">
                  <Pulse className="w-5 h-5 rounded-full" />
                  <Pulse className="h-3 w-24 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Pulse className="h-3 w-8 rounded" />
                  <Pulse className="h-3 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}