import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart } from 'recharts';

export default function ClientSpendChart({ spendRecords, leads }) {
  const chartData = useMemo(() => {
    // Group by week
    const weeks = {};

    spendRecords.forEach(s => {
      const d = new Date(s.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { week: key, spend: 0, leads: 0, appts: 0 };
      weeks[key].spend += s.amount || 0;
    });

    leads.forEach(l => {
      const d = new Date(l.created_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { week: key, spend: 0, leads: 0, appts: 0 };
      weeks[key].leads += 1;
      if (l.appointment_date) weeks[key].appts += 1;
    });

    return Object.values(weeks)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map(w => ({
        ...w,
        weekLabel: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cpa: w.appts > 0 ? Math.round(w.spend / w.appts) : null,
      }));
  }, [spendRecords, leads]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Weekly Performance</h3>
        <p className="text-xs text-gray-400 text-center py-8">No data for selected period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Weekly Performance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="spend" name="Spend ($)" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          <Bar yAxisId="right" dataKey="leads" name="Leads" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar yAxisId="right" dataKey="appts" name="Appts" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Line yAxisId="left" dataKey="cpa" name="CPA ($)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}