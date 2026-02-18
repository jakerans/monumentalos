import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;

    // Get all users and leads
    const [allUsers, allLeads, existingProfiles] = await Promise.all([
      db.User.list(),
      db.Lead.list('-created_date', 5000),
      db.SetterProfile.list(),
    ]);

    const setterUsers = allUsers.filter(u => u.app_role === 'setter');

    // Calculate date ranges
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Build stats per setter
    const calcStats = (setterId, start, end) => {
      const booked = allLeads.filter(l =>
        l.booked_by_setter_id === setterId &&
        l.date_appointment_set &&
        new Date(l.date_appointment_set) >= start &&
        (!end || new Date(l.date_appointment_set) <= end)
      ).length;

      const stlLeads = allLeads.filter(l =>
        l.setter_id === setterId &&
        l.speed_to_lead_minutes != null &&
        new Date(l.created_date) >= start &&
        (!end || new Date(l.created_date) <= end)
      );
      const avgSTL = stlLeads.length > 0
        ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length)
        : null;

      return { booked, avgSTL };
    };

    const profileByUserId = {};
    existingProfiles.forEach(p => { profileByUserId[p.user_id] = p; });

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    for (const setter of setterUsers) {
      const mtdStats = calcStats(setter.id, mtdStart, null);
      const lmStats = calcStats(setter.id, lmStart, lmEnd);
      const existing = profileByUserId[setter.id];

      const profileData = {
        full_name: setter.full_name,
        email: setter.email,
        status: 'active',
        mtd_booked: mtdStats.booked,
        mtd_avg_stl: mtdStats.avgSTL,
        last_month_booked: lmStats.booked,
        last_month_avg_stl: lmStats.avgSTL,
        stats_updated_at: now.toISOString(),
      };

      if (existing) {
        await db.SetterProfile.update(existing.id, profileData);
        updated++;
        delete profileByUserId[setter.id];
      } else {
        await db.SetterProfile.create({
          user_id: setter.id,
          ...profileData,
        });
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