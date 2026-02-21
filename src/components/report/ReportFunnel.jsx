import React from 'react';
import { ChevronRight } from 'lucide-react';

function FunnelStage({ label, count, color, isLast }) {
  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex-1 text-center">
        <p className={`text-2xl sm:text-4xl font-black ${color}`}>{count}</p>
        <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-0.5">{label}</p>
      </div>
      {!isLast && (
        <div className="flex flex-col items-center px-1 sm:px-2 shrink-0">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </div>
      )}
    </div>
  );
}

function ConversionArrow({ rate }) {
  return (
    <div className="flex flex-col items-center px-0.5 sm:px-1 shrink-0 -mx-1">
      <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 bg-slate-700/80 px-2 py-0.5 rounded-full whitespace-nowrap">
        {rate}%
      </span>
    </div>
  );
}

export default function ReportFunnel({ appointmentsBooked, appointmentsShowed, jobsSold }) {
  const showRate = appointmentsBooked > 0 ? ((appointmentsShowed / appointmentsBooked) * 100).toFixed(1) : '0.0';
  const closeRate = appointmentsShowed > 0 ? ((jobsSold / appointmentsShowed) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/40 p-4 sm:p-6 mb-6 sm:mb-8">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Sales Funnel</p>
      <div className="flex items-center">
        <FunnelStage label="Booked" count={appointmentsBooked} color="text-blue-400" />
        <ConversionArrow rate={showRate} />
        <FunnelStage label="Showed" count={appointmentsShowed} color="text-purple-400" />
        <ConversionArrow rate={closeRate} />
        <FunnelStage label="Sold" count={jobsSold} color="text-emerald-400" isLast />
      </div>
    </div>
  );
}