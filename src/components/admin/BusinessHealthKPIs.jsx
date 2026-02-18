import React from 'react';
import { Users, AlertTriangle, UserPlus, UserMinus, DollarSign, TrendingUp, Percent, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

function pctChange(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prior) / prior) * 100);
}

export default function BusinessHealthKPIs({ data }) {
  if (!data || !data.activeClients && data.activeClients !== 0) return null;
  const d = data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      <SparklineCard index={0} label="Active Clients" value={d.activeClients} subtitle={`${d.newClientsThisMonth} new this month`} icon={Users} iconBg="bg-blue-500/10" iconColor="text-blue-400" sparkColor="#60a5fa" />
      <SparklineCard index={1} label="Alerts" value={d.alertClients} subtitle="Clients needing attention" icon={AlertTriangle} iconBg="bg-red-500/10" iconColor="text-red-400" sparkColor="#f87171" />
      <SparklineCard index={2} label="Churn Rate (90d)" value={`${d.churnRate}%`} subtitle={`${d.churnedCount} churned`} icon={UserMinus} iconBg="bg-orange-500/10" iconColor="text-orange-400" sparkColor="#fb923c" />
      <SparklineCard index={3} label="New This Month" value={d.newClientsThisMonth} icon={UserPlus} iconBg="bg-green-500/10" iconColor="text-green-400" sparkColor="#34d399" comparison={{ prior: d.newClientsLastMonth, change: pctChange(d.newClientsThisMonth, d.newClientsLastMonth) }} />
      <SparklineCard index={4} label="Last Mo. Billed" value={`$${d.lastMonthBilledTotal.toLocaleString()}`} subtitle="Performance billing" icon={DollarSign} iconBg="bg-indigo-500/10" iconColor="text-indigo-400" sparkColor="#818cf8" />
      <SparklineCard index={5} label="Collection Rate" value={`${d.collectionRate}%`} subtitle={`$${d.lastMonthCollected.toLocaleString()} collected`} icon={Percent} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" sparkColor="#34d399" />
      <SparklineCard index={6} label="MTD Leads" value={d.mtdLeads} icon={TrendingUp} iconBg="bg-purple-500/10" iconColor="text-purple-400" sparkData={d.leadsSparkline} sparkColor="#c084fc" comparison={{ prior: d.lmLeads, change: pctChange(d.mtdLeads, d.lmLeads) }} />
      <SparklineCard index={7} label="MTD Booked" value={d.mtdBooked} icon={Target} iconBg="bg-cyan-500/10" iconColor="text-cyan-400" sparkData={d.bookedSparkline} sparkColor="#22d3ee" comparison={{ prior: d.lmBooked, change: pctChange(d.mtdBooked, d.lmBooked) }} />
    </div>
  );
}