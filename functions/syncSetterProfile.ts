import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    // Only process User entity events
    if (event?.entity_name !== 'User') {
      return Response.json({ skipped: true });
    }

    const db = base44.asServiceRole.entities;

    if (event.type === 'create' || event.type === 'update') {
      const userData = data;
      if (!userData) {
        return Response.json({ skipped: true, reason: 'no data' });
      }

      const isNowSetter = userData.app_role === 'setter';
      const wasSetter = old_data?.app_role === 'setter';

      if (isNowSetter) {
        // Check if profile already exists
        const existing = await db.SetterProfile.filter({ user_id: event.entity_id });
        if (existing.length > 0) {
          // Update existing profile
          await db.SetterProfile.update(existing[0].id, {
            full_name: userData.full_name || existing[0].full_name,
            email: userData.email || existing[0].email,
            status: 'active',
          });
        } else {
          // Create new profile
          await db.SetterProfile.create({
            user_id: event.entity_id,
            full_name: userData.full_name || 'Unknown Setter',
            email: userData.email || '',
            status: 'active',
          });
        }
      } else if (wasSetter && !isNowSetter) {
        // Role changed away from setter — deactivate profile
        const existing = await db.SetterProfile.filter({ user_id: event.entity_id });
        if (existing.length > 0) {
          await db.SetterProfile.update(existing[0].id, { status: 'inactive' });
        }
      }
    }

    if (event.type === 'delete') {
      // Delete setter profile when user is deleted
      const existing = await db.SetterProfile.filter({ user_id: event.entity_id });
      for (const profile of existing) {
        await db.SetterProfile.delete(profile.id);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});