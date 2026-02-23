import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automations (no auth header) and admin manual triggers
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Manual trigger — verify the caller is admin
      const user = await base44.auth.me();
      if (!user || user.app_role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // If no auth header, this is a scheduled automation — proceed

    const db = base44.asServiceRole.entities;

    // Date ranges
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Fetch data in parallel — only leads from this month and last month
    const [allUsers, mtdLeads, lmLeads, existingProfiles] = await Promise.all([
      db.User.list(),
      db.Lead.filter({ date_appointment_set: { $gte: mtdStart.toISOString() } }, '-created_date', 2000),
      db.Lead.filter({ date_appointment_set: { $gte: lmStart.toISOString(), $lte: lmEnd.toISOString() } }, '-created_date', 2000),
      db.SetterProfile.list(),
    ]);

    // STL leads — last 7 days, regardless of status/dispo/outcome
    const stl7dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const allSTL = await db.Lead.filter({ speed_to_lead_minutes: { $exists: true }, created_date: { $gte: stl7dStart.toISOString() } }, '-created_date', 5000);

    const setterUsers = allUsers.filter(u => u.app_role === 'setter');

    const profileByUserId = {};
    existingProfiles.forEach(p => { profileByUserId[p.user_id] = p; });

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    for (const setter of setterUsers) {
      const booked = mtdLeads.filter(l => l.booked_by_setter_id === setter.id).length;
      // STL: last 7 days, all leads where this setter has speed_to_lead_minutes — no status/dispo/outcome filter
      const stlArr = allSTL.filter(l => l.setter_id === setter.id);
      const avgSTL = stlArr.length > 0
        ? Math.round(stlArr.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlArr.length)
        : null;

      const lmBooked = lmLeads.filter(l => l.booked_by_setter_id === setter.id).length;
      // Last month STL not meaningful for 7-day window, keep as null
      const lmAvgSTL = null;

      const existing = profileByUserId[setter.id];

      const profileData = {
        full_name: setter.full_name,
        email: setter.email,
        status: 'active',
        mtd_booked: booked,
        mtd_avg_stl: avgSTL,
        last_month_booked: lmBooked,
        last_month_avg_stl: lmAvgSTL,
        stats_updated_at: now.toISOString(),
      };

      if (existing) {
        await db.SetterProfile.update(existing.id, profileData);
        updated++;
        delete profileByUserId[setter.id];
      } else {
        await db.SetterProfile.create({ user_id: setter.id, ...profileData });
        created++;
      }
    }

    // Deactivate profiles for users who are no longer setters
    for (const userId in profileByUserId) {
      const profile = profileByUserId[userId];
      if (profile.status === 'active') {
        await db.SetterProfile.update(profile.id, { status: 'inactive' });
        deactivated++;
      }
    }

    return Response.json({ success: true, created, updated, deactivated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});