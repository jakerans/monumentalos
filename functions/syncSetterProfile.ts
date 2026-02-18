import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

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

    // STL leads — ALL leads with speed_to_lead_minutes, regardless of status/dispo/outcome
    const allSTL = await db.Lead.filter({ speed_to_lead_minutes: { $exists: true } }, '-created_date', 5000);

    const setterUsers = allUsers.filter(u => u.app_role === 'setter');

    const profileByUserId = {};
    existingProfiles.forEach(p => { profileByUserId[p.user_id] = p; });

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    for (const setter of setterUsers) {
      const booked = mtdLeads.filter(l => l.booked_by_setter_id === setter.id).length;
      const stlArr = mtdSTL.filter(l => l.setter_id === setter.id && l.speed_to_lead_minutes != null);
      const avgSTL = stlArr.length > 0
        ? Math.round(stlArr.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlArr.length)
        : null;

      const lmBooked = lmLeads.filter(l => l.booked_by_setter_id === setter.id).length;
      const lmSTLArr = lmSTL.filter(l => l.setter_id === setter.id && l.speed_to_lead_minutes != null);
      const lmAvgSTL = lmSTLArr.length > 0
        ? Math.round(lmSTLArr.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / lmSTLArr.length)
        : null;

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