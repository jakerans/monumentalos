import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { setter_id } = await req.json();
    if (!setter_id) {
      return Response.json({ error: 'setter_id is required' }, { status: 400 });
    }

    if (user.app_role !== 'admin' && user.id !== setter_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [lootBoxes, lootWins, profiles, recentLeads, settingsRecords, stlHoursArr] = await Promise.all([
      fetchAllFiltered(sr.LootBox, { setter_id }, '-awarded_date'),
      fetchAllFiltered(sr.LootWin, { setter_id }, '-won_date'),
      sr.SetterProfile.filter({ user_id: setter_id }, '-created_date', 1),
      fetchAllFiltered(sr.Lead, { setter_id, created_date: { $gte: thirtyDaysAgo.toISOString() } }, '-created_date'),
      sr.LootSettings.list('-created_date', 1),
      sr.CompanySettings.filter({ key: 'stl_business_hours' }, '-created_date', 1),
    ]);

    const settings = settingsRecords.length > 0 ? settingsRecords[0] : {};
    const profile = profiles.length > 0 ? profiles[0] : null;

    // STL business hours for overnight exclusion
    const stlHoursRaw = stlHoursArr.length > 0 ? stlHoursArr[0] : null;
    let stlStartHour = 10, stlEndHour = 20, stlTz = 'America/New_York';
    if (stlHoursRaw) {
      try {
        const parsed = typeof stlHoursRaw.value === 'string' ? JSON.parse(stlHoursRaw.value) : stlHoursRaw.value;
        stlStartHour = parsed.start_hour ?? 10;
        stlEndHour = parsed.end_hour ?? 20;
        stlTz = parsed.timezone ?? 'America/New_York';
      } catch (e) { /* defaults */ }
    }
    function isOvernightLead(dateStr, startHour, endHour, tz) {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const h = parseInt(d.toLocaleString('en-US', { timeZone: tz, hour12: false, hour: '2-digit' }), 10);
      return h < startHour || h >= endHour;
    }

    const inventoryCap = settings.inventory_cap ?? 10;
    const yellowWarning = settings.inventory_yellow_warning ?? 8;
    const stlThreshold = settings.eligibility_stl_threshold_minutes ?? 5;

    // Unopened boxes
    const unopenedBoxes = lootBoxes.filter(b => b.status === 'unopened');

    // Eligibility calculation
    let eligible = true;
    let avgSTL = null;
    let lastActiveDate = null;
    let reason = 'no_data';

    // Find leads with STL data in last 30 days — exclude overnight
    const leadsWithSTL = recentLeads.filter(l => l.speed_to_lead_minutes != null && !isOvernightLead(l.lead_received_date || l.created_date, stlStartHour, stlEndHour, stlTz));
    if (leadsWithSTL.length > 0) {
      // Find the most recent day with STL data
      const latestDay = leadsWithSTL[0].created_date.substring(0, 10);
      lastActiveDate = latestDay;

      // Calculate avg STL on that day only
      const sameDayLeads = leadsWithSTL.filter(l => l.created_date.substring(0, 10) === latestDay);
      avgSTL = sameDayLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / sameDayLeads.length;
      avgSTL = Math.round(avgSTL * 10) / 10;

      if (avgSTL > stlThreshold) {
        eligible = false;
        reason = 'stl_too_slow';
      } else {
        eligible = true;
        reason = 'eligible';
      }
    } else {
      // Check for any lead activity to find lastActiveDate
      if (recentLeads.length > 0) {
        // Find most recent day with any activity
        for (const lead of recentLeads) {
          const dates = [lead.created_date, lead.first_call_made_date, lead.date_appointment_set].filter(Boolean);
          for (const d of dates) {
            const dayStr = d.substring(0, 10);
            if (!lastActiveDate || dayStr > lastActiveDate) {
              lastActiveDate = dayStr;
            }
          }
        }
      }
      eligible = true;
      reason = 'no_data';
    }

    // Lifetime stats
    const totalOpened = lootBoxes.filter(b => b.status === 'opened').length;

    let rarestWin = null;
    if (lootWins.length > 0) {
      let maxRarity = -1;
      for (const win of lootWins) {
        const order = RARITY_ORDER[win.rarity] ?? -1;
        if (order > maxRarity) {
          maxRarity = order;
          rarestWin = win.rarity;
        }
      }
    }

    const cashWins = lootWins.filter(w => w.prize_type === 'cash');
    const totalCashWon = cashWins.reduce((s, w) => s + (w.cash_value || 0), 0);
    const biggestWin = cashWins.length > 0
      ? Math.max(...cashWins.map(w => w.cash_value || 0))
      : null;

    // Recent wins — last 10
    const recentWins = lootWins.slice(0, 10);

    // Consecutive no drop
    const consecutiveNoDrop = profile ? (profile.consecutive_bookings_no_drop || 0) : 0;

    // Paid days off bank
    const bankRecords = await sr.PaidDayOffBank.filter({ setter_id }, '-created_date', 1);
    const bank = bankRecords.length > 0 ? bankRecords[0] : null;
    const daysAvailable = bank ? ((bank.days_earned || 0) - (bank.days_used || 0)) : 0;

    return Response.json({
      unopenedBoxes,
      inventoryCap,
      yellowWarning,
      eligibility: {
        eligible,
        avgSTL,
        threshold: stlThreshold,
        lastActiveDate,
        reason,
      },
      lifetimeStats: {
        totalOpened,
        rarestWin,
        totalCashWon,
        biggestWin,
      },
      recentWins,
      consecutiveNoDrop,
      lootSettings: settings,
      paidDaysOffBank: { daysEarned: bank?.days_earned || 0, daysUsed: bank?.days_used || 0, daysAvailable },
    });
  } catch (error) {
    console.error('getSetterInventoryData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});