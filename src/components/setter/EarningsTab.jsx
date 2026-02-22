import React from 'react';
import { DollarSign, Clock, TrendingUp, Gift, Trophy, TrendingDown, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const FREQ_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  semi_monthly: 'Semi-Monthly',
  monthly: 'Monthly',
};

function fmtMoney(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PayPeriodHeader({ data }) {
  const isHourly = data.employee.classification === 'hourly' ||
    (data.employee.classification === 'contractor' && data.employee.contractor_billing_type === 'hourly');
  const hoursDiff = data.hours_this_period - data.hours_last_period;
  const up = hoursDiff >= 0;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/60">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pay Period</p>
        <p className="text-lg font-bold text-white">{fmtDateShort(data.period_start)} – {fmtDateShort(data.period_end)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#D6FF03]/10 text-[#D6FF03] border border-[#D6FF03]/20">
          {FREQ_LABELS[data.payroll_frequency] || data.payroll_frequency}
        </span>
        {isHourly ? (
          <div className="text-right">
            <p className="text-lg font-bold text-white">{data.hours_this_period.toFixed(1)} <span className="text-sm text-slate-400 font-normal">hrs</span></p>
            {data.hours_last_period > 0 && (
              <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${up ? 'text-green-400' : 'text-red-400'}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(hoursDiff).toFixed(1)} hrs vs last
              </p>
            )}
          </div>
        ) : (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-700 text-slate-300">
            Salaried
          </span>
        )}
      </div>
    </div>
  );
}

function EarningsBreakdown({ data }) {
  const emp = data.employee;
  const isHourly = emp.classification === 'hourly';
  const isContractorHourly = emp.classification === 'contractor' && emp.contractor_billing_type === 'hourly';

  let baseExplain = 'Flat per cycle';
  if (isHourly) baseExplain = `$${emp.hourly_rate}/hr × ${data.hours_this_period.toFixed(1)} hrs`;
  else if (isContractorHourly) baseExplain = `$${emp.contractor_rate}/hr × ${data.hours_this_period.toFixed(1)} hrs`;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 space-y-3">
      <Row icon={<DollarSign className="w-4 h-4 text-slate-400" />} label="Base Pay" sub={baseExplain} amount={data.estimated_base_pay} />
      <Row icon={<Trophy className="w-4 h-4 text-amber-400" />} label="Spiff Bonuses" amount={data.pending_spiff_bonus}
        sub={data.pending_spiff_bonus === 0 ? 'No bonuses pending' : `${data.spiff_details.filter(s => s.met).length} bonus${data.spiff_details.filter(s => s.met).length !== 1 ? 'es' : ''} earned`}
        muted={data.pending_spiff_bonus === 0} />
      <Row icon={<Gift className="w-4 h-4 text-purple-400" />} label="Loot Box Cash" amount={data.loot_cash_this_period}
        muted={data.loot_cash_this_period === 0} />
      <div className="border-t border-slate-700/50 pt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-white">Estimated Total</span>
        <span className="text-xl font-black" style={{ color: '#D6FF03' }}>{fmtMoney(data.estimated_total)}</span>
      </div>
    </div>
  );
}

function Row({ icon, label, sub, amount, muted }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 min-w-0">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div>
          <p className={`text-sm font-medium ${muted ? 'text-slate-500' : 'text-white'}`}>{label}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${muted ? 'text-slate-600' : 'text-white'}`}>{fmtMoney(amount)}</span>
    </div>
  );
}

function ActiveSpiffs({ spiffs }) {
  if (!spiffs || spiffs.length === 0) {
    return <p className="text-xs text-slate-500 italic">No active spiffs this period</p>;
  }
  return (
    <div className="space-y-3">
      {spiffs.map((sp, i) => {
        const pct = sp.goal > 0 ? Math.min((sp.progress / sp.goal) * 100, 100) : 0;
        return (
          <div key={i} className="p-3 rounded-lg border border-slate-700/40 bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{sp.title}</p>
              {sp.met ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">Completed ✓</span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">In Progress</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Progress value={pct} className="h-2 flex-1 bg-slate-700" />
              <span className="text-xs text-slate-400 font-mono">{sp.progress}/{sp.goal}</span>
            </div>
            <p className="text-xs text-slate-500">Reward: <span className="text-white font-medium">{fmtMoney(sp.reward)}</span></p>
          </div>
        );
      })}
    </div>
  );
}

function EarningsTab({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (data?.no_employee_record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <DollarSign className="w-10 h-10 text-slate-600" />
        <p className="text-sm text-slate-400">Your pay profile hasn't been set up yet. Contact your manager.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 max-w-2xl">
      <PayPeriodHeader data={data} />
      <EarningsBreakdown data={data} />

      {/* Active Spiffs */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" /> Active Spiffs
        </h3>
        <ActiveSpiffs spiffs={data.spiff_details} />
      </div>

      {/* Loot Box Winnings */}
      {data.loot_cash_this_month > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5">
          <Gift className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            <span className="text-white font-medium">{fmtMoney(data.loot_cash_this_month)}</span> won from {data.loot_wins_this_month} loot box{data.loot_wins_this_month !== 1 ? 'es' : ''} this month.
          </p>
        </div>
      )}

      {/* Recent Pay History */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Recent Pay History
        </h3>
        {data.recent_payroll.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No payroll history yet</p>
        ) : (
          <div className="space-y-1.5">
            {data.recent_payroll.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700/40 bg-slate-800/40">
                <span className="text-sm text-slate-300">{fmtDateShort(p.date)}</span>
                <span className="text-sm font-semibold text-white">{fmtMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(EarningsTab);