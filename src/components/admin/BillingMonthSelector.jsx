import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BillingMonthSelector({ selectedMonth, onChange }) {
  const [year, month] = selectedMonth.split('-').map(Number);
  const label = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const shift = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => shift(-1)} className="p-1 rounded hover:bg-slate-800">
        <ChevronLeft className="w-5 h-5 text-slate-400" />
      </button>
      <h2 className="text-lg font-bold text-white min-w-[180px] text-center">{label}</h2>
      <button onClick={() => shift(1)} className="p-1 rounded hover:bg-slate-800">
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>
    </div>
  );
}