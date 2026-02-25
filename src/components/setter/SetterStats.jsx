import React from 'react';
import { Phone, Clock, Calendar, CheckCircle, Target } from 'lucide-react';
import SparklineCard from '../shared/SparklineCard';
import STLStatusWidget from './STLStatusWidget';

function pctChange(current, prior) {
  if (prior === 0 && current === 0) return 0;
  if (prior === 0) return 100;
  return Math.round(((current - prior) / prior) * 100);
}

function SetterStats({ preStats = {}, leads, user }) {
  // Support both new preStats path and legacy leads+user path
  const stats = preStats.mtdBooked !== undefined ? buildFromPreStats(preStats) : buildFromLeads(leads, user);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {stats.map((s, i) => {
        if (s.label === '_stl_widget_') {
          return (
            <STLStatusWidget
              key="stl"
              avgSTL={s.avgSTL}
              teamAvgSTL={s.teamAvgSTL}
              sparkData={s.stlSpark}
            />
          );
        }
        return (
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
            subtitle={s.subtitle}
          />
        );
      })}
    </div>
  );
}

export default React.memo(SetterStats);

function buildFromPreStats(s) {
  return [
    {
      label: 'MTD Booked',
      value: s.mtdBooked || 0,
      icon: Calendar,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
      sparkColor: '#34d399',
      sparkData: s.bookedSpark || [],
      comparison: { prior: s.lmBooked || 0, change: pctChange(s.mtdBooked || 0, s.lmBooked || 0) },
    },
    {
      label: 'MTD Calls',
      value: s.mtdCalls || 0,
      icon: Phone,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      sparkColor: '#60a5fa',
      sparkData: s.callsSpark || [],
      comparison: { prior: s.lmCalls || 0, change: pctChange(s.mtdCalls || 0, s.lmCalls || 0) },
    },
    {
      label: '_stl_widget_',
      avgSTL: s.avgSTL || 0,
      teamAvgSTL: s.teamAvgSTL || 0,
      stlSpark: s.stlSpark || [],
    },
    {
      label: 'Show Rate',
      value: `${s.showRate || 0}%`,
      icon: Target,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      sparkColor: '#c084fc',
      sparkData: [],
      comparison: s.lmShowRate > 0 ? { prior: `${s.lmShowRate}%`, change: pctChange(s.showRate || 0, s.lmShowRate || 0) } : null,
    },
    {
      label: "Today's Appts",
      value: s.todayAppts || 0,
      icon: CheckCircle,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      sparkColor: '#22d3ee',
      sparkData: s.apptSpark || [],
      comparison: { prior: s.yesterdayAppts || 0, change: pctChange(s.todayAppts || 0, s.yesterdayAppts || 0) },
      subtitle: `Team: ${s.teamTodayAppts || 0}`,
    },
  ];
}

// Legacy fallback (kept for backward compat if needed)
function buildFromLeads(leads = [], user) {
  if (!leads.length || !user) return [];
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const todayStr = now.toISOString().split('T')[0];
  const userId = user?.id;

  const inMTD = (d) => d && new Date(d) >= mtdStart;
  const inLM = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lmStart && dt <= lmEnd; };

  function buildDailySparkline(filterFn, days = 14) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      data.push({ v: leads.filter(l => filterFn(l, dStr)).length });
    }
    return data;
  }

  const mtdBooked = leads.filter(l => l.booked_by_setter_id === userId && inMTD(l.date_appointment_set)).length;
  const lmBooked = leads.filter(l => l.booked_by_setter_id === userId && inLM(l.date_appointment_set)).length;
  const mtdCalls = leads.filter(l => l.setter_id === userId && inMTD(l.first_call_made_date)).length;
  const lmCalls = leads.filter(l => l.setter_id === userId && inLM(l.first_call_made_date)).length;

  const stl7dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const my7dSTL = leads.filter(l => l.setter_id === userId && l.speed_to_lead_minutes != null && l.created_date && new Date(l.created_date) >= stl7dStart);
  const avgSTL = my7dSTL.length > 0 ? Math.round(my7dSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / my7dSTL.length * 10) / 10 : 0;
  const team7dSTL = leads.filter(l => l.speed_to_lead_minutes != null && l.created_date && new Date(l.created_date) >= stl7dStart);
  const teamAvgSTL = team7dSTL.length > 0 ? Math.round(team7dSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / team7dSTL.length * 10) / 10 : 0;

  const todayAppts = leads.filter(l => l.booked_by_setter_id === userId && l.appointment_date && l.appointment_date.startsWith(todayStr)).length;
  const teamTodayAppts = leads.filter(l => l.appointment_date && l.appointment_date.startsWith(todayStr)).length;
  const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
  const yesterdayAppts = leads.filter(l => l.booked_by_setter_id === userId && l.appointment_date && l.appointment_date.startsWith(yesterdayStr)).length;
  const teamYesterdayAppts = leads.filter(l => l.appointment_date && l.appointment_date.startsWith(yesterdayStr)).length;

  const show30dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const show60dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
  const my30dBooked = leads.filter(l => l.booked_by_setter_id === userId && l.date_appointment_set && new Date(l.date_appointment_set) >= show30dStart);
  const my30dShowed = my30dBooked.filter(l => l.disposition === 'showed').length;
  const showRate = my30dBooked.length > 0 ? Math.round((my30dShowed / my30dBooked.length) * 100) : 0;
  const prev30dBooked = leads.filter(l => l.booked_by_setter_id === userId && l.date_appointment_set && new Date(l.date_appointment_set) >= show60dStart && new Date(l.date_appointment_set) < show30dStart);
  const prev30dShowed = prev30dBooked.filter(l => l.disposition === 'showed').length;
  const lmShowRate = prev30dBooked.length > 0 ? Math.round((prev30dShowed / prev30dBooked.length) * 100) : 0;

  return buildFromPreStats({
    mtdBooked, lmBooked, mtdCalls, lmCalls,
    avgSTL, teamAvgSTL,
    todayAppts, teamTodayAppts, yesterdayAppts, teamYesterdayAppts,
    showRate, lmShowRate,
    bookedSpark: buildDailySparkline((l, dStr) => l.booked_by_setter_id === userId && l.date_appointment_set && l.date_appointment_set.startsWith(dStr)),
    callsSpark: buildDailySparkline((l, dStr) => l.setter_id === userId && l.first_call_made_date && l.first_call_made_date.startsWith(dStr)),
    stlSpark: buildDailySparkline((l, dStr) => l.setter_id === userId && l.speed_to_lead_minutes != null && l.created_date && l.created_date.startsWith(dStr), 7),
    apptSpark: buildDailySparkline((l, dStr) => l.booked_by_setter_id === userId && l.appointment_date && l.appointment_date.startsWith(dStr)),
  });
}