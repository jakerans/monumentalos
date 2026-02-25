import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import DateRangePicker from '../components/admin/DateRangePicker';
import SetterStatsKPIs from '../components/admin/SetterStatsKPIs';
import SetterStatsTable from '../components/admin/SetterStatsTable';
import SetterStatsDQChart from '../components/admin/SetterStatsDQChart';
import SetterStatsLeadChannels from '../components/admin/SetterStatsLeadChannels';
import LeadChannelByIndustry from '../components/admin/LeadChannelByIndustry';
import SourceIndustryHeatmap from '../components/admin/SourceIndustryHeatmap';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';

dayjs.extend(isBetween);

const DQ_REASONS = ['looking_for_work', 'not_interested', 'wrong_invalid_number', 'project_size', 'oosa', 'client_availability'];

function calcStats(setters, leads, inRange) {
  return setters.map(setter => {
    const firstCalls = leads.filter(l => l.setter_id === setter.id && l.first_call_made_date && inRange(l.first_call_made_date));
    const booked = leads.filter(l => l.booked_by_setter_id === setter.id && l.date_appointment_set && inRange(l.date_appointment_set));
    const showed = booked.filter(l => l.disposition === 'showed');
    // DQ by this setter (using disqualified_by_setter_id)
    const dqBySetter = leads.filter(l => l.disqualified_by_setter_id === setter.id && l.status === 'disqualified' && l.disqualified_date && inRange(l.disqualified_date));
    // Fallback: also count old-style DQs attributed via setter_id where disqualified_by_setter_id is not set
    const dqLegacy = leads.filter(l => !l.disqualified_by_setter_id && l.setter_id === setter.id && l.status === 'disqualified' && l.first_call_made_date && inRange(l.first_call_made_date));
    const dqAll = [...dqBySetter, ...dqLegacy];

    const stlValues = firstCalls.filter(l => l.speed_to_lead_minutes != null).map(l => l.speed_to_lead_minutes);
    const avgSTL = stlValues.length ? Math.round(stlValues.reduce((a, b) => a + b, 0) / stlValues.length) : null;
    const showRate = booked.length > 0 ? parseFloat(((showed.length / booked.length) * 100).toFixed(1)) : null;

    const dqReasons = {};
    DQ_REASONS.forEach(r => { dqReasons[r] = 0; });
    dqAll.forEach(l => { if (l.dq_reason && dqReasons[l.dq_reason] !== undefined) dqReasons[l.dq_reason]++; });

    const stlUnder5 = stlValues.filter(v => v <= 5).length;
    const stl5to15 = stlValues.filter(v => v > 5 && v <= 15).length;
    const stlOver15 = stlValues.filter(v => v > 15).length;

    return {
      id: setter.id,
      name: setter.full_name,
      firstCalls: firstCalls.length,
      booked: booked.length,
      showed: showed.length,
      dq: dqAll.length,
      avgSTL,
      showRate,
      dqReasons,
      stlUnder5,
      stl5to15,
      stlOver15,
    };
  }).sort((a, b) => b.booked - a.booked);
}

export default function SetterStats() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.app_role !== 'admin') {
          if (currentUser.app_role === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else navigate(createPageUrl('SetterDashboard'));
        }
      } catch { base44.auth.redirectToLogin(); }
    };
    checkAuth();
  }, [navigate]);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['setter-stats-data', startDate, endDate],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterPerformanceData', { startDate, endDate });
      return res.data;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const clients = rawData?.clients || [];
  const leads = rawData?.leads || [];
  const users = rawData?.users || [];

  const setters = useMemo(() => users.filter(u => u.app_role === 'setter'), [users]);

  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  const inRange = (d) => d ? dayjs(d).isBetween(start, end, null, '[]') : false;

  const stats = useMemo(() => calcStats(setters, leads, inRange), [setters, leads, startDate, endDate]);

  const totalBooked = stats.reduce((s, r) => s + r.booked, 0);
  const totalShowed = stats.reduce((s, r) => s + r.showed, 0);
  const totalDQ = stats.reduce((s, r) => s + r.dq, 0);
  const totalLeadsGenerated = leads.filter(l =>
    (l.lead_received_date && inRange(l.lead_received_date)) ||
    (!l.lead_received_date && l.created_date && inRange(l.created_date))
  ).length;
  const allSTL = stats.filter(r => r.avgSTL != null).map(r => r.avgSTL);
  const avgSTL = allSTL.length ? Math.round(allSTL.reduce((a, b) => a + b, 0) / allSTL.length) : null;
  const bookingRate = totalLeadsGenerated > 0 ? parseFloat(((totalBooked / totalLeadsGenerated) * 100).toFixed(1)) : null;
  const showRate = totalBooked > 0 ? parseFloat(((totalShowed / totalBooked) * 100).toFixed(1)) : null;

  // Prior period (same duration, immediately before)
  const periodDays = end.diff(start, 'day') + 1;
  const priorEnd = start.subtract(1, 'day').endOf('day');
  const priorStart = priorEnd.subtract(periodDays - 1, 'day').startOf('day');
  const inPriorRange = (d) => d ? dayjs(d).isBetween(priorStart, priorEnd, null, '[]') : false;

  const priorKPIs = useMemo(() => {
    const pStats = calcStats(setters, leads, inPriorRange);
    const pBooked = pStats.reduce((s, r) => s + r.booked, 0);
    const pShowed = pStats.reduce((s, r) => s + r.showed, 0);
    const pDQ = pStats.reduce((s, r) => s + r.dq, 0);
    const pLeads = leads.filter(l =>
      (l.lead_received_date && inPriorRange(l.lead_received_date)) ||
      (!l.lead_received_date && l.created_date && inPriorRange(l.created_date))
    ).length;
    const pSTLs = pStats.filter(r => r.avgSTL != null).map(r => r.avgSTL);
    const pAvgSTL = pSTLs.length ? Math.round(pSTLs.reduce((a, b) => a + b, 0) / pSTLs.length) : null;
    const pBookRate = pLeads > 0 ? parseFloat(((pBooked / pLeads) * 100).toFixed(1)) : null;
    const pShowRate = pBooked > 0 ? parseFloat(((pShowed / pBooked) * 100).toFixed(1)) : null;
    return { setterCount: setters.length, totalLeads: pLeads, booked: pBooked, showed: pShowed, dq: pDQ, avgSTL: pAvgSTL, bookingRate: pBookRate, showRate: pShowRate };
  }, [setters, leads, startDate, endDate]);

  // Daily sparkline data
  const dailySparklines = useMemo(() => {
    const days = [];
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
      days.push(cursor.format('YYYY-MM-DD'));
      cursor = cursor.add(1, 'day');
    }
    const leadsPerDay = {}, bookedPerDay = {}, showedPerDay = {}, dqPerDay = {};
    days.forEach(d => { leadsPerDay[d] = 0; bookedPerDay[d] = 0; showedPerDay[d] = 0; dqPerDay[d] = 0; });
    leads.forEach(l => {
      const rDate = dayjs(l.lead_received_date || l.created_date).format('YYYY-MM-DD');
      if (leadsPerDay[rDate] !== undefined) leadsPerDay[rDate]++;
      if (l.date_appointment_set) {
        const bDate = dayjs(l.date_appointment_set).format('YYYY-MM-DD');
        if (bookedPerDay[bDate] !== undefined) bookedPerDay[bDate]++;
      }
      if (l.disposition === 'showed' && l.appointment_date) {
        const sDate = dayjs(l.appointment_date).format('YYYY-MM-DD');
        if (showedPerDay[sDate] !== undefined) showedPerDay[sDate]++;
      }
      if (l.status === 'disqualified' && l.disqualified_date) {
        const dDate = dayjs(l.disqualified_date).format('YYYY-MM-DD');
        if (dqPerDay[dDate] !== undefined) dqPerDay[dDate]++;
      }
    });
    return {
      leads: days.map(d => leadsPerDay[d]),
      booked: days.map(d => bookedPerDay[d]),
      showed: days.map(d => showedPerDay[d]),
      dq: days.map(d => dqPerDay[d]),
    };
  }, [leads, startDate, endDate]);

  const overallDQReasons = useMemo(() => {
    const totals = {};
    DQ_REASONS.forEach(r => { totals[r] = 0; });
    stats.forEach(s => { DQ_REASONS.forEach(r => { totals[r] += s.dqReasons[r] || 0; }); });
    return totals;
  }, [stats]);

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading setter stats..." />;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-[#0B0F1A] flex">
        <AdminSidebar user={user} currentPage="SetterStats" clients={clients} />

        <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Booking Report</h1>
              <p className="text-sm text-slate-400">Lead channels, booking performance, and DQ analysis</p>
            </div>
            <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          </div>

          <SetterStatsKPIs
            setterCount={setters.length}
            totalLeadsGenerated={totalLeadsGenerated}
            totalBooked={totalBooked}
            totalShowed={totalShowed}
            totalDQ={totalDQ}
            avgSTL={avgSTL}
            bookingRate={bookingRate}
            showRate={showRate}
          />

          <SetterStatsLeadChannels leads={leads} inRange={inRange} />

          <LeadChannelByIndustry leads={leads} inRange={inRange} />

          <SourceIndustryHeatmap leads={leads} inRange={inRange} />

          <SetterStatsTable stats={stats} />

          <SetterStatsDQChart stats={stats} overallDQReasons={overallDQReasons} />
        </main>
        <AdminMobileNav currentPage="SetterStats" clients={clients} user={user} />
      </div>
    </PageErrorBoundary>
  );
}