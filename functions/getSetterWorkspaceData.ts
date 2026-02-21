import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appRole = user.app_role;
    if (appRole !== 'setter' && appRole !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const setterId = user.id;
    const now = new Date();

    // Today's date string YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0];

    // Current week boundaries (Monday–Sunday)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    // Month start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const sr = base44.asServiceRole;

    // Parallel fetches
    const [
      activeEntries,
      allSchedules,
      recentEntries,
      ptoBanks,
      weekEntries,
      monthEntries,
    ] = await Promise.all([
      // Active clock-in
      sr.entities.TimeEntry.filter({ setter_id: setterId, status: 'active' }, '-created_date', 1),
      // Week schedule (fetch all for setter, filter by date range in code)
      sr.entities.SetterSchedule.filter({ setter_id: setterId }, '-date', 100),
      // Recent time entries
      sr.entities.TimeEntry.filter({ setter_id: setterId }, '-clock_in', 14),
      // PTO bank
      sr.entities.PaidDayOffBank.filter({ setter_id: setterId }, '-created_date', 1),
      // Week completed entries for hours calc
      sr.entities.TimeEntry.filter({ setter_id: setterId, status: 'completed' }, '-clock_in', 200),
      // Month completed entries (reuse weekEntries above, filter in code)
      Promise.resolve(null),
    ]);

    // Clock status
    const clockStatus = activeEntries.length > 0
      ? { id: activeEntries[0].id, clock_in: activeEntries[0].clock_in }
      : null;

    // Today's schedule
    const todaySchedule = allSchedules.find(s => s.date === todayStr) || null;

    // Week schedule (Mon-Sun)
    const weekSchedule = allSchedules.filter(s => s.date >= mondayStr && s.date <= sundayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Hours this week
    const hoursThisWeek = weekEntries
      .filter(e => e.date && e.date >= mondayStr && e.date <= sundayStr)
      .reduce((sum, e) => sum + (e.total_hours || 0), 0);

    // Hours this month
    const hoursThisMonth = weekEntries
      .filter(e => e.date && e.date >= monthStartStr)
      .reduce((sum, e) => sum + (e.total_hours || 0), 0);

    // PTO bank
    const ptoRecord = ptoBanks.length > 0 ? ptoBanks[0] : null;
    const ptoBank = ptoRecord
      ? {
          days_earned: ptoRecord.days_earned || 0,
          days_used: ptoRecord.days_used || 0,
          days_available: (ptoRecord.days_earned || 0) - (ptoRecord.days_used || 0),
        }
      : { days_earned: 0, days_used: 0, days_available: 0 };

    return Response.json({
      clockStatus,
      todaySchedule,
      weekSchedule,
      recentTimeEntries: recentEntries,
      ptoBank,
      hoursThisWeek: Math.round(hoursThisWeek * 100) / 100,
      hoursThisMonth: Math.round(hoursThisMonth * 100) / 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});