import React from 'react';
import { Phone, Calendar, Target, Clock, TrendingUp, Award } from 'lucide-react';

export default function SetterPerformanceTable({ users, leads, clients, startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');
  const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= start && dt <= end; };

  const setters = users.filter(u => u.app_role === 'setter');
  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';

  const stats = setters.map(setter => {
    const firstCalls = leads.filter(l => l.setter_id === setter.id && l.first_call_made_date && inRange(l.first_call_made_date));
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && inRange(l.date_appointment_set));
    const showed = booked.filter(l => l.disposition === 'showed');
    const dq = leads.filter(l => l.setter_id === setter.id && l.status === 'disqualified' && inRange(l.first_call_made_date));

    const stlValues = firstCalls.filter(l => l.speed_to_lead_minutes != null).map(l => l.speed_to_lead_minutes);
    const avgSTL = stlValues.length ? Math.round(stlValues.reduce((a, b) => a + b, 0) / stlValues.length) : null;
    const bookingRate = firstCalls.length > 0 ? ((booked.length / firstCalls.length) * 100).toFixed(1) : 0;
    const showRate = booked.length > 0 ? ((showed.length / booked.length) * 100).toFixed(1) : 0;

    // Breakdown by client
    const clientBreakdown = {};
    booked.forEach(l => {
      const cn = getClientName(l.client_id);
      clientBreakdown[cn] = (clientBreakdown[cn] || 0) + 1;
    });

    return {
      id: setter.id,
      name: setter.full_name,
      firstCalls: firstCalls.length,
      booked: booked.length,
      showed: showed.length,
      dq: dq.length,
      avgSTL,
      bookingRate,
      showRate,
      clientBreakdown,
    };
  }).sort((a, b) => b.booked - a.booked);

  const totalCalls = stats.reduce((s, r) => s + r.firstCalls, 0);
  const totalBooked = stats.reduce((s, r) => s + r.booked, 0);
  const totalShowed = stats.reduce((s, r) => s + r.showed, 0);

  const summaryCards = [
    { label: 'Total Setters', value: setters.length, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Total First Calls', value: totalCalls, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Booked', value: totalBooked, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Showed', value: totalShowed, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Booking Rate', value: totalCalls > 0 ? `${((totalBooked / totalCalls) * 100).toFixed(1)}%` : '—', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map((c, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{c.label}</p>
              <div className={`p-1 rounded ${c.bg}`}>
                <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Setter detail table */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-sm font-bold text-white">Individual Setter Stats</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Setter</th>
                <th className="px-3 py-2 text-right">First Calls</th>
                <th className="px-3 py-2 text-right">Booked</th>
                <th className="px-3 py-2 text-right">Showed</th>
                <th className="px-3 py-2 text-right">DQ'd</th>
                <th className="px-3 py-2 text-right">Avg STL</th>
                <th className="px-3 py-2 text-right">Booking %</th>
                <th className="px-3 py-2 text-right">Show %</th>
                <th className="px-3 py-2 text-left">Client Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {stats.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-500">No setters found</td></tr>
              ) : stats.map((s, i) => (
                <tr key={s.id} className="hover:bg-slate-700/20">
                  <td className="px-4 py-2.5">
                    <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-white">{s.name}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{s.firstCalls}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-blue-400">{s.booked}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-green-400">{s.showed}</td>
                  <td className="px-3 py-2.5 text-right text-red-400">{s.dq}</td>
                  <td className="px-3 py-2.5 text-right">
                    {s.avgSTL != null ? (
                      <span className={`font-medium ${s.avgSTL <= 5 ? 'text-green-600' : s.avgSTL <= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                        {s.avgSTL}m
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-slate-300">{s.bookingRate}%</td>
                  <td className="px-3 py-2.5 text-right font-medium text-slate-300">{s.showRate}%</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(s.clientBreakdown).map(([name, count]) => (
                        <span key={name} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded">
                          {name}: {count}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}