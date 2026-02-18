import React, { useMemo } from 'react';
import { Phone, Clock, Calendar, CheckCircle, Zap, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';

function buildDailySparkline(leads, filterFn, days = 14) {
  const now = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const count = leads.filter(l => filterFn(l, dStr)).length;
    data.push({ v: count });
  }
  return data;
}

function pctChange(current, prior) {
  if (prior === 0 && current === 0) return 0;
  if (prior === 0) return 100;
  return Math.round(((current - prior) / prior) * 100);
}

export default function SetterStats({ leads = [], user }) {
  const stats = useMemo(() => {
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const todayStr = now.toISOString().split('T')[0];
    const userId = user?.id;

    const inMTD = (d) => d && new Date(d) >= mtdStart;
    const inLM = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lmStart && dt <= lmEnd; };

    // MTD booked by me
    const mtdBooked = leads.filter(l => l.booked_by_setter_id === userId && inMTD(l.date_appointment_set)).length;
    const lmBooked = leads.filter(l => l.booked_by_setter_id === userId && inLM(l.date_appointment_set)).length;
    const bookedSpark = buildDailySparkline(leads, (l, dStr) =>
      l.booked_by_setter_id === userId && l.date_appointment_set && l.date_appointment_set.startsWith(dStr)
    );

    // MTD first calls by me
    const mtdCalls = leads.filter(l => l.setter_id === userId && inMTD(l.first_call_made_date)).length;
    const lmCalls = leads.filter(l => l.setter_id === userId && inLM(l.first_call_made_date)).length;
    const callsSpark = buildDailySparkline(leads, (l, dStr) =>
      l.setter_id === userId && l.first_call_made_date && l.first_call_made_date.startsWith(dStr)
    );

    // Avg STL this month (mine)
    const mtdSTLLeads = leads.filter(l => l.setter_id === userId && l.speed_to_lead_minutes != null && inMTD(l.created_date));
    const lmSTLLeads = leads.filter(l => l.setter_id === userId && l.speed_to_lead_minutes != null && inLM(l.created_date));
    const avgSTL = mtdSTLLeads.length > 0 ? Math.round(mtdSTLLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / mtdSTLLeads.length * 10) / 10 : 0;
    const lmAvgSTL = lmSTLLeads.length > 0 ? Math.round(lmSTLLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / lmSTLLeads.length) : 0;

    // Team avg STL this month (everyone)
    const teamSTLLeads = leads.filter(l => l.speed_to_lead_minutes != null && inMTD(l.created_date));
    const teamAvgSTL = teamSTLLeads.length > 0 ? Math.round(teamSTLLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / teamSTLLeads.length * 10) / 10 : 0;
    const stlSpark = buildDailySparkline(leads, (l, dStr) => {
      if (l.setter_id !== userId || l.speed_to_lead_minutes == null) return false;
      return l.created_date && l.created_date.startsWith(dStr);
    });

    // Today's appointments (all)
    const todayAppts = leads.filter(l => l.appointment_date && l.appointment_date.startsWith(todayStr)).length;
    const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
    const yesterdayAppts = leads.filter(l => l.appointment_date && l.appointment_date.startsWith(yesterdayStr)).length;
    const apptSpark = buildDailySparkline(leads, (l, dStr) =>
      l.appointment_date && l.appointment_date.startsWith(dStr)
    );

    // Show rate this month (booked by me that showed)
    const mtdMyBooked = leads.filter(l => l.booked_by_setter_id === userId && inMTD(l.date_appointment_set));
    const mtdShowed = mtdMyBooked.filter(l => l.disposition === 'showed').length;
    const showRate = mtdMyBooked.length > 0 ? Math.round((mtdShowed / mtdMyBooked.length) * 100) : 0;
    const lmMyBooked = leads.filter(l => l.booked_by_setter_id === userId && inLM(l.date_appointment_set));
    const lmShowed = lmMyBooked.filter(l => l.disposition === 'showed').length;
    const lmShowRate = lmMyBooked.length > 0 ? Math.round((lmShowed / lmMyBooked.length) * 100) : 0;

    return [
      {
        label: 'MTD Booked',
        value: mtdBooked,
        icon: Calendar,
        iconColor: 'text-green-400',
        iconBg: 'bg-green-500/10',
        sparkColor: '#34d399',
        sparkData: bookedSpark,
        comparison: { prior: lmBooked, change: pctChange(mtdBooked, lmBooked) },
      },
      {
        label: 'MTD Calls',
        value: mtdCalls,
        icon: Phone,
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/10',
        sparkColor: '#60a5fa',
        sparkData: callsSpark,
        comparison: { prior: lmCalls, change: pctChange(mtdCalls, lmCalls) },
      },
      {
        label: 'Avg STL',
        value: avgSTL > 0 ? `${avgSTL}m` : '—',
        icon: Zap,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/10',
        sparkColor: '#fbbf24',
        sparkData: stlSpark,
        comparison: lmAvgSTL > 0 ? { prior: `${lmAvgSTL}m`, change: pctChange(avgSTL, lmAvgSTL), invertColor: true } : null,
      },
      {
        label: 'Show Rate',
        value: `${showRate}%`,
        icon: Target,
        iconColor: 'text-purple-400',
        iconBg: 'bg-purple-500/10',
        sparkColor: '#c084fc',
        sparkData: [],
        comparison: lmShowRate > 0 ? { prior: `${lmShowRate}%`, change: pctChange(showRate, lmShowRate) } : null,
      },
      {
        label: "Today's Appts",
        value: todayAppts,
        icon: CheckCircle,
        iconColor: 'text-cyan-400',
        iconBg: 'bg-cyan-500/10',
        sparkColor: '#22d3ee',
        sparkData: apptSpark,
        comparison: { prior: yesterdayAppts, change: pctChange(todayAppts, yesterdayAppts) },
      },
    ];
  }, [leads, user]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {stats.map((s, i) => (
        <SparklineCard
          key={s.label}
          index={i}
          label={s.label}
          value={s.value}
          icon={s.icon}
          iconBg={s.iconBg}
          iconColor={s.iconColor}
          sparkColor={s.sparkColor}
          sparkData={s.sparkData}
          comparison={s.comparison}
        />
      ))}
    </div>
  );
}