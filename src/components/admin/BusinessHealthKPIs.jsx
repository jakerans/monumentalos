import React from 'react';
import { Users, AlertTriangle, UserPlus, UserMinus, DollarSign, TrendingUp, Percent, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';
import InfoTooltip from '../shared/InfoTooltip';

function pctChange(cur, prior) {
  if (prior === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prior) / prior) * 100);
}

export default function BusinessHealthKPIs({ data }) {
  if (!data || !data.activeClients && data.activeClients !== 0) return null;
  const d = data;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
      <SparklineCard index={0} label="Active Clients" value={d.activeClients} subtitle={`${d.newClientsThisMonth} new this month`} icon={Users} iconBg="bg-blue-500/10" iconColor="text-blue-400" sparkColor="#60a5fa" />
      <SparklineCard index={1} label="Alerts" value={d.alertClients} subtitle="Clients needing attention" icon={AlertTriangle} iconBg="bg-red-500/10" iconColor="text-red-400" sparkColor="#f87171" tooltip="Painting clients that are falling behind on their goals or spending over $300/appointment with no results. These are the accounts you or your MM need to look at today." />
      <SparklineCard index={2} label="Churn Rate (90d)" value={`${d.churnRate}%`} subtitle={`${d.churnedCount} churned`} icon={UserMinus} iconBg="bg-orange-500/10" iconColor="text-orange-400" sparkColor="#fb923c" tooltip="What percentage of your clients have left in the last 90 days. If this is climbing, it's a sign something's off — check if it's results, communication, or pricing." />
      <SparklineCard index={3} label="New This Month" value={d.newClientsThisMonth} icon={UserPlus} iconBg="bg-green-500/10" iconColor="text-green-400" sparkColor="#34d399" comparison={{ prior: d.newClientsLastMonth, change: pctChange(d.newClientsThisMonth, d.newClientsLastMonth) }} />
      <SparklineCard index={4} label="Last Mo. Billed" value={`$${d.lastMonthBilledTotal.toLocaleString()}`} subtitle="Performance billing" icon={DollarSign} iconBg="bg-indigo-500/10" iconColor="text-indigo-400" sparkColor="#818cf8" tooltip="Total amount you invoiced clients for last month across all billing types — retainers, pay-per-set, and pay-per-show. This is what your assistant reviewed and sent out." />
      <SparklineCard index={5} label="Collection Rate" value={`${d.collectionRate}%`} subtitle={`$${d.lastMonthCollected.toLocaleString()} collected`} icon={Percent} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" sparkColor="#34d399" tooltip="Of everything you billed last month, what percentage has actually been paid? If this isn't 100%, you have outstanding invoices to follow up on." />
      <SparklineCard index={6} label="MTD Leads" value={d.mtdLeads} icon={TrendingUp} iconBg="bg-purple-500/10" iconColor="text-purple-400" sparkData={d.leadsSparkline} sparkColor="#c084fc" comparison={{ prior: d.lmLeads, change: pctChange(d.mtdLeads, d.lmLeads) }} />
      <SparklineCard index={7} label="MTD Booked" value={d.mtdBooked} icon={Target} iconBg="bg-cyan-500/10" iconColor="text-cyan-400" sparkData={d.bookedSparkline} sparkColor="#22d3ee" comparison={{ prior: d.lmBooked, change: pctChange(d.mtdBooked, d.lmBooked) }} />
    </div>
  );
}