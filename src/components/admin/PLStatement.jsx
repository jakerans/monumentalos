import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const CATEGORY_LABELS = {
  ad_spend: 'Ad Spend', payroll: 'Payroll', software: 'Software',
  office: 'Office', contractor: 'Contractor', travel: 'Travel',
  processing_fee: 'Processing Fee', other: 'Other', uncategorized: 'Uncategorized',
};

function fmt(v) {
  const neg = v < 0;
  const abs = Math.abs(Math.round(v));
  return `${neg ? '(' : ''}$${abs.toLocaleString()}${neg ? ')' : ''}`;
}

function pctOf(part, whole) {
  if (!whole) return '—';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function PLRow({ label, amount, total, bold, indent, negative, border, bg }) {
  return (
    <div className={`flex items-center justify-between px-4 py-1.5 ${border ? 'border-t border-slate-600/50' : ''} ${bg || ''}`}>
      <span className={`text-xs ${bold ? 'font-bold text-white' : 'text-slate-300'} ${indent ? 'pl-4' : ''}`}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        <span className={`text-xs tabular-nums ${bold ? 'font-bold' : 'font-medium'} ${negative ? 'text-red-400' : amount < 0 ? 'text-red-400' : 'text-white'}`}>
          {fmt(amount)}
        </span>
        {total !== undefined && (
          <span className="text-[10px] text-slate-500 w-12 text-right tabular-nums">{pctOf(Math.abs(amount), total)}</span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="px-4 py-2 bg-slate-700/30 border-y border-slate-600/40">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}

export default function PLStatement({ kpis, expenses, billingRecords, clients, startDate, endDate }) {
  const cur = kpis?.current || {};
  const pri = kpis?.prior || {};

  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const ir = (d) => d && dayjs(d).isBetween(start, end, null, '[]');

  // Income breakdown by client
  const incomeByClient = useMemo(() => {
    const map = {};
    const paidInRange = (billingRecords || []).filter(b => b.status === 'paid' && ir(b.paid_date));
    paidInRange.forEach(b => {
      const cName = clients.find(c => c.id === b.client_id)?.name || 'Unknown';
      map[cName] = (map[cName] || 0) + (b.paid_amount || b.calculated_amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [billingRecords, clients, startDate, endDate]);

  // Expense breakdowns
  const expenseBreakdowns = useMemo(() => {
    const filtered = (expenses || []).filter(e => e.date && e.expense_type !== 'distribution' && ir(e.date));
    const cogsItems = filtered.filter(e => e.expense_type === 'cogs');
    const overheadItems = filtered.filter(e => e.expense_type !== 'cogs');

    const groupByCategory = (items) => {
      const map = {};
      items.forEach(e => {
        const cat = e.category || 'uncategorized';
        map[cat] = (map[cat] || 0) + (e.amount || 0);
      });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    return {
      cogsByCategory: groupByCategory(cogsItems),
      cogsTotal: cogsItems.reduce((s, e) => s + (e.amount || 0), 0),
      overheadByCategory: groupByCategory(overheadItems),
      overheadTotal: overheadItems.reduce((s, e) => s + (e.amount || 0), 0),
    };
  }, [expenses, startDate, endDate]);

  const grossRevenue = cur.grossRevenue || 0;
  const collected = cur.collected || 0;
  const cogs = expenseBreakdowns.cogsTotal;
  const overhead = expenseBreakdowns.overheadTotal;
  const grossProfit = grossRevenue - cogs;
  const netProfit = collected - cogs - overhead;
  const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
  const netMargin = collected > 0 ? (netProfit / collected) * 100 : 0;

  // Prior period
  const priorGross = pri.grossRevenue || 0;
  const priorNet = pri.netProfit || 0;

  function changeIndicator(cur, prior) {
    if (!prior) return null;
    const pct = ((cur - prior) / Math.abs(prior)) * 100;
    const isUp = pct >= 0;
    return (
      <span className={`text-[10px] font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}%
      </span>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Profit & Loss Statement</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {dayjs(startDate).format('MMM D, YYYY')} — {dayjs(endDate).format('MMM D, YYYY')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {priorGross > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-slate-500">vs Prior Period</p>
              <div className="flex items-center gap-2">
                {changeIndicator(grossRevenue, priorGross)}
                {changeIndicator(netProfit, priorNet)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === INCOME === */}
      <SectionHeader label="Income" />
      <PLRow label="Gross Revenue (Billed)" amount={grossRevenue} bold />
      {incomeByClient.map(([name, amt]) => (
        <PLRow key={name} label={name} amount={amt} total={grossRevenue} indent />
      ))}
      <PLRow label="Cash Collected" amount={collected} bold border />
      <PLRow label="Outstanding (Uncollected)" amount={grossRevenue - collected} indent />

      {/* === COGS === */}
      <SectionHeader label="Cost of Goods Sold (COGS)" />
      {expenseBreakdowns.cogsByCategory.length === 0 ? (
        <div className="px-8 py-2 text-[11px] text-slate-500 italic">No COGS expenses</div>
      ) : (
        expenseBreakdowns.cogsByCategory.map(([cat, amt]) => (
          <PLRow key={cat} label={CATEGORY_LABELS[cat] || cat} amount={-amt} total={grossRevenue} indent negative />
        ))
      )}
      <PLRow label="Total COGS" amount={-cogs} bold border negative />

      {/* === GROSS PROFIT === */}
      <div className="px-4 py-2.5 bg-slate-700/20 border-y border-slate-600/50 flex items-center justify-between">
        <span className="text-xs font-bold text-white">Gross Profit</span>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-bold ${grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(grossProfit)}
          </span>
          <span className="text-[10px] font-medium text-slate-400 w-12 text-right">{grossMargin.toFixed(1)}%</span>
        </div>
      </div>

      {/* === OVERHEAD === */}
      <SectionHeader label="Operating Expenses (Overhead)" />
      {expenseBreakdowns.overheadByCategory.length === 0 ? (
        <div className="px-8 py-2 text-[11px] text-slate-500 italic">No overhead expenses</div>
      ) : (
        expenseBreakdowns.overheadByCategory.map(([cat, amt]) => (
          <PLRow key={cat} label={CATEGORY_LABELS[cat] || cat} amount={-amt} total={collected} indent negative />
        ))
      )}
      <PLRow label="Total Overhead" amount={-overhead} bold border negative />

      {/* === NET PROFIT === */}
      <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-600/50 flex items-center justify-between">
        <span className="text-sm font-bold text-white">Net Profit</span>
        <div className="flex items-center gap-4">
          <span className={`text-base font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(netProfit)}
          </span>
          <span className="text-[10px] font-medium text-slate-400 w-12 text-right">{netMargin.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}