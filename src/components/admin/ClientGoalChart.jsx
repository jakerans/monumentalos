import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

const GOAL_STATUSES = [
  { key: 'goal_met', label: 'Goal Met', color: '#10b981', bg: 'bg-emerald-500' },
  { key: 'on_track', label: 'On Track', color: '#3b82f6', bg: 'bg-blue-500' },
  { key: 'behind_confident', label: 'Behind (Confident)', color: '#f59e0b', bg: 'bg-amber-500' },
  { key: 'behind_wont_meet', label: "Behind (Won't Meet)", color: '#ef4444', bg: 'bg-red-500' },
  { key: 'no_goal', label: 'No Goal Set', color: '#d1d5db', bg: 'bg-gray-300' },
];

export default function ClientGoalChart({ clients }) {
  const active = clients.filter(c => c.status === 'active');

  const data = GOAL_STATUSES.map(s => ({
    name: s.label,
    value: s.key === 'no_goal'
      ? active.filter(c => !c.goal_status).length
      : active.filter(c => c.goal_status === s.key).length,
    color: s.color,
    bg: s.bg,
  })).filter(d => d.value > 0);

  const total = active.length;
  const goalMet = active.filter(c => c.goal_status === 'goal_met').length;
  const onTrack = active.filter(c => c.goal_status === 'on_track').length;
  const healthyPct = total > 0 ? (((goalMet + onTrack) / total) * 100).toFixed(0) : 0;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4" style={{color:'#D6FF03'}} />
        <h3 className="text-sm font-bold text-white">Client Goal Health</h3>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-36 h-36 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={38}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} clients`, name]}
                contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{healthyPct}%</span>
            <span className="text-[9px] text-slate-400">healthy</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${d.bg}`} />
                <span className="text-xs text-slate-300">{d.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}