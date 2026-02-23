import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entityRef, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.list(sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

async function fetchAllFiltered(entityRef, filter, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.filter(filter, sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const stl7dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const show30dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const show60dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sr = base44.asServiceRole.entities;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch all data in parallel using service role with pagination safety
    const [allLeads, clients, spiffs, profiles] = await Promise.all([
      fetchAllFiltered(sr.Lead, { created_date: { $gte: ninetyDaysAgo.toISOString() } }, '-created_date'),
      sr.Client.list(),
      fetchAllFiltered(sr.Spiff, { status: 'active' }, '-created_date'),
      fetchAllFiltered(sr.SetterProfile, { status: 'active' }, '-created_date'),
    ]);

    // --- Helpers ---
    const inMTD = (d) => d && new Date(d) >= mtdStart;
    const inLM = (d) => { if (!d) return false; const dt = new Date(d); return dt >= lmStart && dt <= lmEnd; };

    // --- Settable clients (exclude retainer) ---
    const settableClients = clients.filter(c => c.billing_type !== 'retainer');
    const settableClientIds = new Set(settableClients.map(c => c.id));

    // --- Pipeline leads (exclude retainer, sold, lost, completed) ---
    const pipelineLeads = allLeads.filter(l => {
      if (!settableClientIds.has(l.client_id)) return false;
      if (l.outcome === 'sold' || l.outcome === 'lost' || l.status === 'completed') return false;
      return true;
    });

    const newLeads = pipelineLeads.filter(l => l.status === 'new');
    const inProgressLeads = pipelineLeads.filter(l => l.status === 'first_call_made' || l.status === 'contacted');
    const bookedLeads = pipelineLeads.filter(l => l.status === 'appointment_booked');
    const dqLeads = pipelineLeads.filter(l => l.status === 'disqualified');

    // --- SetterStats pre-computation ---
    const mtdBooked = allLeads.filter(l => l.booked_by_setter_id === userId && inMTD(l.date_appointment_set)).length;
    const lmBooked = allLeads.filter(l => l.booked_by_setter_id === userId && inLM(l.date_appointment_set)).length;
    const mtdCalls = allLeads.filter(l => l.setter_id === userId && inMTD(l.first_call_made_date)).length;
    const lmCalls = allLeads.filter(l => l.setter_id === userId && inLM(l.first_call_made_date)).length;

    // Avg STL (last 7 days, mine)
    const my7dSTL = allLeads.filter(l => l.setter_id === userId && l.speed_to_lead_minutes != null && l.created_date && new Date(l.created_date) >= stl7dStart);
    const avgSTL = my7dSTL.length > 0 ? Math.round(my7dSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / my7dSTL.length * 10) / 10 : 0;

    // Team avg STL (last 7 days)
    const team7dSTL = allLeads.filter(l => l.speed_to_lead_minutes != null && l.created_date && new Date(l.created_date) >= stl7dStart);
    const teamAvgSTL = team7dSTL.length > 0 ? Math.round(team7dSTL.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / team7dSTL.length * 10) / 10 : 0;

    // Today's appointments (all)
    const todayAppts = allLeads.filter(l => l.appointment_date && l.appointment_date.startsWith(todayStr)).length;
    const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
    const yesterdayAppts = allLeads.filter(l => l.appointment_date && l.appointment_date.startsWith(yesterdayStr)).length;

    // Show rate (last 30 days, booked by me)
    const my30dBooked = allLeads.filter(l => l.booked_by_setter_id === userId && l.date_appointment_set && new Date(l.date_appointment_set) >= show30dStart);
    const my30dShowed = my30dBooked.filter(l => l.disposition === 'showed').length;
    const showRate = my30dBooked.length > 0 ? Math.round((my30dShowed / my30dBooked.length) * 100) : 0;
    const prev30dBooked = allLeads.filter(l => l.booked_by_setter_id === userId && l.date_appointment_set && new Date(l.date_appointment_set) >= show60dStart && new Date(l.date_appointment_set) < show30dStart);
    const prev30dShowed = prev30dBooked.filter(l => l.disposition === 'showed').length;
    const lmShowRate = prev30dBooked.length > 0 ? Math.round((prev30dShowed / prev30dBooked.length) * 100) : 0;

    // Sparkline builders (14 days)
    function buildSpark(filterFn, days = 14) {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        data.push({ v: allLeads.filter(l => filterFn(l, dStr)).length });
      }
      return data;
    }

    const bookedSpark = buildSpark((l, dStr) => l.booked_by_setter_id === userId && l.date_appointment_set && l.date_appointment_set.startsWith(dStr));
    const callsSpark = buildSpark((l, dStr) => l.setter_id === userId && l.first_call_made_date && l.first_call_made_date.startsWith(dStr));
    const stlSpark = buildSpark((l, dStr) => l.setter_id === userId && l.speed_to_lead_minutes != null && l.created_date && l.created_date.startsWith(dStr), 7);
    const apptSpark = buildSpark((l, dStr) => l.appointment_date && l.appointment_date.startsWith(dStr));

    // --- Spiff progress pre-computation ---
    function getSpiffProgress(spiff, scope_user_id) {
      if (spiff.qualifier === 'appointments') {
        if (spiff.scope === 'team_company') {
          return allLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
        }
        const sid = spiff.scope === 'individual' ? spiff.assigned_setter_id : scope_user_id;
        return allLeads.filter(l => l.booked_by_setter_id === sid && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
      }
      if (spiff.qualifier === 'stl') {
        if (spiff.scope === 'team_company') {
          const stlLeads = allLeads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
          return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
        }
        const sid = spiff.scope === 'individual' ? spiff.assigned_setter_id : scope_user_id;
        const stlLeads = allLeads.filter(l => l.setter_id === sid && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
        return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      }
      return 0;
    }

    function getDailySpiffProgress(spiff, scope_user_id) {
      if (spiff.qualifier === 'appointments') {
        if (spiff.scope === 'team_company') {
          return allLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= dayStart).length;
        }
        const sid = spiff.scope === 'individual' ? spiff.assigned_setter_id : scope_user_id;
        return allLeads.filter(l => l.booked_by_setter_id === sid && l.date_appointment_set && new Date(l.date_appointment_set) >= dayStart).length;
      }
      if (spiff.qualifier === 'stl') {
        if (spiff.scope === 'team_company') {
          const stlLeads = allLeads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= dayStart);
          return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
        }
        const sid = spiff.scope === 'individual' ? spiff.assigned_setter_id : scope_user_id;
        const stlLeads = allLeads.filter(l => l.setter_id === sid && l.speed_to_lead_minutes != null && new Date(l.created_date) >= dayStart);
        return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      }
      return 0;
    }

    const spiffsWithProgress = spiffs.map(sp => ({
      ...sp,
      _progress: getSpiffProgress(sp, userId),
      _dailyProgress: sp.is_daily ? getDailySpiffProgress(sp, userId) : null,
    }));

    // --- DailyAIMessage context ---
    const mySpiffsForAI = spiffsWithProgress.filter(sp => {
      if (sp.scope === 'individual') return sp.assigned_setter_id === userId;
      return true;
    }).map(sp => {
      const isSTL = sp.qualifier === 'stl';
      const met = isSTL ? (sp._progress != null && sp._progress <= sp.goal_value) : (sp._progress >= sp.goal_value);
      return { title: sp.title, progress: sp._progress, goal: sp.goal_value, qualifier: sp.qualifier, met };
    });

    // --- Leaderboard from live leads data ---
    // Get all unique setter user_ids that have booked at least one MTD lead
    const allSetterIds = new Set([
      ...allLeads
        .filter(l => l.booked_by_setter_id && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart)
        .map(l => l.booked_by_setter_id),
      // Also include the current user even if they have 0 bookings this month
      userId,
    ]);

    // Build a profile map for display fields
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user_id] = p; });

    // Calculate live stats per setter
    const liveLeaderboard = [...allSetterIds].map(sid => {
      const profile = profileMap[sid] || {};
      const liveMtdBooked = allLeads.filter(l => l.booked_by_setter_id === sid && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
      const stlLeads = allLeads.filter(l => l.setter_id === sid && l.speed_to_lead_minutes != null && l.created_date && new Date(l.created_date) >= stl7dStart);
      const liveAvgSTL = stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length * 10) / 10 : null;
      return {
        ...profile,
        user_id: sid,
        mtd_booked: liveMtdBooked,
        mtd_avg_stl: liveAvgSTL,
      };
    }).sort((a, b) => (b.mtd_booked || 0) - (a.mtd_booked || 0));

    const myIndex = liveLeaderboard.findIndex(s => s.user_id === userId);
    const myRank = myIndex !== -1 ? myIndex + 1 : null;

    // Client name map (for lead cards)
    const clientMap = {};
    settableClients.forEach(c => { clientMap[c.id] = c.name; });

    return Response.json({
      pipeline: {
        newLeads,
        inProgressLeads,
        bookedLeads,
        dqLeads,
      },
      stats: {
        mtdBooked, lmBooked, mtdCalls, lmCalls,
        avgSTL, teamAvgSTL,
        todayAppts, yesterdayAppts,
        showRate, lmShowRate,
        bookedSpark, callsSpark, stlSpark, apptSpark,
      },
      spiffs: spiffsWithProgress,
      leaderboard: {
        profiles: liveLeaderboard,
        myRank,
      },
      aiContext: {
        spiffSummaries: mySpiffsForAI,
        myRank,
        leaderboardLength: liveLeaderboard.length,
        topBooked: liveLeaderboard[0]?.mtd_booked || 0,
      },
      clients: settableClients.map(c => ({ id: c.id, name: c.name, booking_link: c.booking_link, billing_type: c.billing_type })),
      clientMap,
      allLeads,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});