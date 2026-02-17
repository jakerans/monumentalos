import React from 'react';
import { Users, AlertTriangle, UserPlus, UserMinus, DollarSign, TrendingUp, Percent, Target } from 'lucide-react';

function KPICard({ label, value, subtitle, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
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

  // New clients this month (created_date in current month)
  const newClientsThisMonth = clients.filter(c => inMTD(c.created_date)).length;

  // Churned = inactive clients (simple metric)
  const churnedCount = inactiveClients.length;
  const churnRate = clients.length > 0 ? ((churnedCount / clients.length) * 100).toFixed(0) : 0;

  // Alerts: clients with goal_status behind_wont_meet or high CPA
  const alertClients = activeClients.filter(c => {
    if (c.goal_status === 'behind_wont_meet') return true;
    const cLeads = leads.filter(l => l.client_id === c.id);
    const mtdBooked = cLeads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length;
    const mtdSpend = spend.filter(s => s.client_id === c.id && inMTD(s.date)).reduce((s, r) => s + (r.amount || 0), 0);
    if (mtdSpend > 500 && mtdBooked === 0) return true;
    if (mtdBooked > 0 && (mtdSpend / mtdBooked) > 300) return true;
    return false;
  });

  // Last month billing performance
  const lastMonthTotal = lastMonthBilling.reduce((s, b) => {
    const amt = b.billing_type === 'retainer' ? (b.manual_amount || b.calculated_amount || 0) : (b.calculated_amount || 0);
    return s + amt;
  }, 0);
  const lastMonthCollected = lastMonthBilling.filter(b => b.status === 'paid').reduce((s, b) => s + (b.paid_amount || b.calculated_amount || 0), 0);
  const collectionRate = lastMonthTotal > 0 ? ((lastMonthCollected / lastMonthTotal) * 100).toFixed(0) : 0;

  // MTD leads & booked
  const mtdLeads = leads.filter(l => inMTD(l.created_date)).length;
  const mtdBooked = leads.filter(l => l.date_appointment_set && inMTD(l.date_appointment_set)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      <KPICard label="Active Clients" value={activeClients.length} subtitle={`${newClientsThisMonth} new this month`} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
      <KPICard label="Alerts" value={alertClients.length} subtitle="Clients needing attention" icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" />
      <KPICard label="Churn Rate" value={`${churnRate}%`} subtitle={`${churnedCount} inactive`} icon={UserMinus} iconBg="bg-orange-50" iconColor="text-orange-600" />
      <KPICard label="New This Month" value={newClientsThisMonth} icon={UserPlus} iconBg="bg-green-50" iconColor="text-green-600" />
      <KPICard label="Last Mo. Billed" value={`$${lastMonthTotal.toLocaleString()}`} subtitle="Performance billing" icon={DollarSign} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      <KPICard label="Collection Rate" value={`${collectionRate}%`} subtitle={`$${lastMonthCollected.toLocaleString()} collected`} icon={Percent} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      <KPICard label="MTD Leads" value={mtdLeads} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
      <KPICard label="MTD Booked" value={mtdBooked} icon={Target} iconBg="bg-cyan-50" iconColor="text-cyan-600" />
    </div>
  );
}