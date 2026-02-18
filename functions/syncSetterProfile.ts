import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;

    // Get all users
    const allUsers = await db.User.list();
    const setterUsers = allUsers.filter(u => u.app_role === 'setter');

    // Get all existing setter profiles
    const existingProfiles = await db.SetterProfile.list();
    const profileByUserId = {};
    existingProfiles.forEach(p => { profileByUserId[p.user_id] = p; });

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    // Create or update profiles for current setters
    for (const setter of setterUsers) {
      const existing = profileByUserId[setter.id];
      if (existing) {
        // Update if name/email changed or was inactive
        if (existing.full_name !== setter.full_name || existing.email !== setter.email || existing.status !== 'active') {
          await db.SetterProfile.update(existing.id, {
            full_name: setter.full_name,
            email: setter.email,
            status: 'active',
          });
          updated++;
        }
        delete profileByUserId[setter.id];
      } else {
        // Create new profile
        await db.SetterProfile.create({
          user_id: setter.id,
          full_name: setter.full_name || 'Unknown Setter',
          email: setter.email || '',
          status: 'active',
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