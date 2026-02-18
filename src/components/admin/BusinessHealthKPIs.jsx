import React, { useMemo } from 'react';
import { Users, AlertTriangle, UserPlus, UserMinus, DollarSign, TrendingUp, Percent, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

function buildDailySparkline(items, dateKey, days = 14) {
  const now = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    data.push({ v: items.filter(item => item[dateKey]?.startsWith(dayStr)).length });
  }
  return data;
}

function pctChange(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prior) / prior) * 100);
}

export default function BusinessHealthKPIs({ clients, leads, spend, payments, billingRecords, lastMonthBilling }) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const inMTD = (d) => d && new Date(d) >= thisMonthStart;
  const inLastMonth = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lastMonthStart && dt <= lastMonthEnd; };

  const activeClients = clients.filter(c => c.status === 'active');
  const inactiveClients = clients.filter(c => c.status === 'inactive');
  const newClientsThisMonth = clients.filter(c => inMTD(c.created_date)).length;
  const newClientsLastMonth = clients.filter(c => inLastMonth(c.created_date)).length;

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const churnedRecently = inactiveClients.filter(c => c.deactivated_date && new Date(c.deactivated_date) >= ninetyDaysAgo);
  const churnedCount = churnedRecently.length;
  const baseCount = activeClients.length + churnedCount;
  const churnRate = baseCount > 0 ? ((churnedCount / baseCount) * 100).toFixed(0) : 0;

  const alertClients = activeClients.filter(c => {
    if (c.goal_status === 'behind_wont_meet') return true;
    const cLeads = leads.filter(l => l.client_id === c.id);
    const mtdBooked = cLeads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length;
    const mtdSpend = spend.filter(s => s.client_id === c.id && inMTD(s.date)).reduce((s, r) => s + (r.amount || 0), 0);
    if (mtdSpend > 500 && mtdBooked === 0) return true;
    if (mtdBooked > 0 && (mtdSpend / mtdBooked) > 300) return true;
    return false;
  });

  const lastMonthTotal = lastMonthBilling.reduce((s, b) => s + (b.billing_type === 'retainer' ? (b.manual_amount || b.calculated_amount || 0) : (b.calculated_amount || 0)), 0);
  const lastMonthCollected = lastMonthBilling.filter(b => b.status === 'paid').reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
  const collectionRate = lastMonthTotal > 0 ? ((lastMonthCollected / lastMonthTotal) * 100).toFixed(0) : 0;

  const mtdLeads = leads.filter(l => inMTD(l.created_date)).length;
  const mtdBooked = leads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length;
  const lmLeads = leads.filter(l => inLastMonth(l.created_date)).length;
  const lmBooked = leads.filter(l => l.date_appointment_set && inLastMonth(l.date_appointment_set)).length;

  const leadsSparkline = useMemo(() => buildDailySparkline(leads, 'created_date'), [leads]);
  const bookedSparkline = useMemo(() => buildDailySparkline(leads.filter(l => l.date_appointment_set), 'date_appointment_set'), [leads]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      <SparklineCard index={0} label="Active Clients" value={activeClients.length} subtitle={`${newClientsThisMonth} new this month`} icon={Users} iconBg="bg-blue-500/10" iconColor="text-blue-400" sparkColor="#60a5fa" />
      <SparklineCard index={1} label="Alerts" value={alertClients.length} subtitle="Clients needing attention" icon={AlertTriangle} iconBg="bg-red-500/10" iconColor="text-red-400" sparkColor="#f87171" />
      <SparklineCard index={2} label="Churn Rate (90d)" value={`${churnRate}%`} subtitle={`${churnedCount} churned`} icon={UserMinus} iconBg="bg-orange-500/10" iconColor="text-orange-400" sparkColor="#fb923c" />
      <SparklineCard index={3} label="New This Month" value={newClientsThisMonth} icon={UserPlus} iconBg="bg-green-500/10" iconColor="text-green-400" sparkColor="#34d399" comparison={{ prior: newClientsLastMonth, change: pctChange(newClientsThisMonth, newClientsLastMonth) }} />
      <SparklineCard index={4} label="Last Mo. Billed" value={`$${lastMonthTotal.toLocaleString()}`} subtitle="Performance billing" icon={DollarSign} iconBg="bg-indigo-500/10" iconColor="text-indigo-400" sparkColor="#818cf8" />
      <SparklineCard index={5} label="Collection Rate" value={`${collectionRate}%`} subtitle={`$${lastMonthCollected.toLocaleString()} collected`} icon={Percent} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" sparkColor="#34d399" />
      <SparklineCard index={6} label="MTD Leads" value={mtdLeads} icon={TrendingUp} iconBg="bg-purple-500/10" iconColor="text-purple-400" sparkData={leadsSparkline} sparkColor="#c084fc" comparison={{ prior: lmLeads, change: pctChange(mtdLeads, lmLeads) }} />
      <SparklineCard index={7} label="MTD Booked" value={mtdBooked} icon={Target} iconBg="bg-cyan-500/10" iconColor="text-cyan-400" sparkData={bookedSparkline} sparkColor="#22d3ee" comparison={{ prior: lmBooked, change: pctChange(mtdBooked, lmBooked) }} />
    </div>
  );
}