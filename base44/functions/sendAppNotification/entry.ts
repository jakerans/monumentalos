import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { recipient_role, recipient_user_id, type, title, message, source_user_id, source_entity_id } = await req.json();

    if (!recipient_role || !type || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.AppNotification.create({
      recipient_role,
      recipient_user_id: recipient_user_id || null,
      type,
      title,
      message,
      source_user_id: source_user_id || null,
      source_entity_id: source_entity_id || null,
      read: false,
    });

    return Response.json({ success: true, notification_id: notification.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});