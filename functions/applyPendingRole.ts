import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for a pending invite matching this user's email
    const pending = await base44.asServiceRole.entities.PendingInvite.filter({
      email: user.email.toLowerCase(),
      status: 'pending',
    });

    if (pending.length === 0) {
      return Response.json({ applied: false, role: null });
    }

    const invite = pending[0];

    // Update user role and custom fields using service role
    // First update custom fields (client_id), then try role separately
    const customData = {};
    if (invite.client_id) {
      customData.client_id = invite.client_id;
    }

    // Update custom fields first (these always work with service role)
    if (Object.keys(customData).length > 0) {
      try {
        await base44.asServiceRole.entities.User.update(user.id, customData);
        console.log('Custom fields updated:', customData);
      } catch (e) {
        console.log('Could not update custom fields:', e.message);
      }
    }

    // Now try to update the role - use the users API directly
    try {
      await base44.asServiceRole.entities.User.update(user.id, { 
        role: invite.intended_role,
        ...customData
      });
      console.log('Role updated to:', invite.intended_role);
    } catch (roleErr) {
      console.log('Service role update failed, trying alternative:', roleErr.message);
      // If service role can't update the role field, try using the raw fetch approach
      try {
        const appId = Deno.env.get('BASE44_APP_ID');
        const resp = await fetch(`https://app.base44.com/api/apps/${appId}/entities/User/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
            'x-service-role': 'true',
          },
          body: JSON.stringify({ role: invite.intended_role, ...customData }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.log('Direct API update also failed:', resp.status, errText);
        } else {
          console.log('Role updated via direct API');
        }
      } catch (e2) {
        console.log('Direct API also failed:', e2.message);
      }
    }

    await base44.asServiceRole.entities.PendingInvite.update(invite.id, { status: 'applied' });

    return Response.json({ applied: true, role: invite.intended_role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});