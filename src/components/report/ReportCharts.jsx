import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b'];

export default function ReportCharts({ spendRecords, bookedLeads, appointmentLeads, soldLeads }) {
  // Monthly summary bar chart
  const monthlyData = useMemo(() => {
    const months = {};

    spendRecords.forEach(s => {
      const key = s.date?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].spend += s.amount || 0;
    });

    bookedLeads.forEach(l => {
      const key = l.date_appointment_set?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].booked += 1;
    });

    appointmentLeads.forEach(l => {
      if (l.disposition !== 'showed') return;
      const key = l.appointment_date?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].showed += 1;
    });

    soldLeads.filter(l => l.outcome === 'sold').forEach(l => {
      const key = l.date_sold?.slice(0, 7);
      if (!key) return;
      if (!months[key]) months[key] = { month: key, spend: 0, booked: 0, showed: 0, sold: 0, revenue: 0 };
      months[key].sold += 1;
      months[key].revenue += l.sale_amount || 0;
    });

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
      ...m,
      month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }));
  }, [spendRecords, bookedLeads, appointmentLeads, soldLeads]);

  // Disposition pie chart
  const dispositionData = useMemo(() => {
    const counts = { showed: 0, cancelled: 0, scheduled: 0, rescheduled: 0 };
    appointmentLeads.forEach(l => {
      const d = l.disposition || 'scheduled';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [appointmentLeads]);

  // Outcome pie chart
  const outcomeData = useMemo(() => {
    const counts = { sold: 0, lost: 0, pending: 0 };
    appointmentLeads.forEach(l => {
      if (l.disposition !== 'showed') return;
      const o = l.outcome || 'pending';
      counts[o] = (counts[o] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [appointmentLeads]);

  const PIE_COLORS_DISP = { Showed: '#22c55e', Cancelled: '#ef4444', Scheduled: '#3b82f6', Rescheduled: '#a855f7' };
  const PIE_COLORS_OUT = { Sold: '#22c55e', Lost: '#ef4444', Pending: '#f59e0b' };

  return (
    <div className="space-y-6">
      {/* Monthly overview bar chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Overview</h3>
        {monthlyData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No data available for the selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="booked" name="Booked" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="showed" name="Showed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sold" name="Sold" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spend & Revenue chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Spend vs Revenue</h3>
        {monthlyData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No data available for the selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="spend" name="Spend" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Disposition</h3>
          {dispositionData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dispositionData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {dispositionData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS_DISP[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Outcome Breakdown</h3>
          {outcomeData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {outcomeData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS_OUT[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}