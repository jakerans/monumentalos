import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appRole = user.app_role;
    const isAdmin = user.role === 'admin' || appRole === 'admin';
    const isSetter = appRole === 'setter';
    if (!isAdmin && !isSetter) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const sr = base44.asServiceRole;

    if (action === 'request_edit') {
      const { time_entry_id, requested_clock_in, requested_clock_out, reason } = body;
      if (!time_entry_id || !requested_clock_in || !requested_clock_out || !reason) {
        return Response.json({ error: 'Missing required fields: time_entry_id, requested_clock_in, requested_clock_out, reason' }, { status: 400 });
      }

      // Fetch the original TimeEntry
      const allEntries = await sr.entities.TimeEntry.filter({ id: time_entry_id }, '-created_date', 1);
      // Filter workaround — fetch by setter or all
      let entry = null;
      if (allEntries.length > 0 && allEntries[0].id === time_entry_id) {
        entry = allEntries[0];
      } else {
        // Fallback: fetch broader set
        const broader = await sr.entities.TimeEntry.filter({}, '-created_date', 2000);
        entry = broader.find(e => e.id === time_entry_id);
      }

      if (!entry) {
        return Response.json({ error: 'TimeEntry not found' }, { status: 404 });
      }

      // Verify ownership — setters can only edit their own entries
      if (!isAdmin && entry.setter_id !== user.id) {
        return Response.json({ error: 'You can only edit your own time entries' }, { status: 403 });
      }

      // Must be completed — don't allow editing active entries
      if (entry.status === 'active') {
        return Response.json({ error: 'Cannot edit an active entry. Please clock out first.' }, { status: 400 });
      }

      // Check for existing pending edit request on this entry
      const existingRequests = await sr.entities.TimeEntryEditRequest.filter({ time_entry_id }, '-created_date', 10);
      const pendingExists = existingRequests.find(r => r.status === 'pending');
      if (pendingExists) {
        return Response.json({ error: 'A pending edit request already exists for this time entry' }, { status: 400 });
      }

      // Calculate requested total hours
      const reqIn = new Date(requested_clock_in);
      const reqOut = new Date(requested_clock_out);
      if (reqOut <= reqIn) {
        return Response.json({ error: 'Requested clock out must be after clock in' }, { status: 400 });
      }
      const requested_total_hours = Math.round((reqOut - reqIn) / 3600000 * 100) / 100;
      if (requested_total_hours <= 0 || requested_total_hours >= 24) {
        return Response.json({ error: 'Requested total hours must be between 0 and 24' }, { status: 400 });
      }

      // Get setter name
      let setterName = user.full_name || user.email;
      if (isAdmin && entry.setter_id !== user.id) {
        const allUsers = await sr.entities.User.filter({}, '-created_date', 500);
        const setter = allUsers.find(u => u.id === entry.setter_id);
        setterName = setter ? (setter.full_name || setter.email) : 'Unknown';
      }

      // Create the edit request
      const editRequest = await sr.entities.TimeEntryEditRequest.create({
        time_entry_id,
        setter_id: entry.setter_id,
        setter_name: setterName,
        original_clock_in: entry.clock_in || null,
        original_clock_out: entry.clock_out || null,
        original_total_hours: entry.total_hours || null,
        requested_clock_in,
        requested_clock_out,
        requested_total_hours,
        reason,
        status: 'pending',
      });

      // Send notification to admin
      const entryDate = entry.date || requested_clock_in.split('T')[0];
      const origHours = entry.total_hours ? entry.total_hours.toFixed(2) : 'N/A';
      const reqHours = requested_total_hours.toFixed(2);

      await sr.functions.invoke('sendAppNotification', {
        recipient_role: 'admin',
        type: 'time_entry_edit',
        title: '⏱️ Clock Edit Request',
        message: `${setterName} is requesting to edit their clock record for ${entryDate}. Original: ${origHours}h → Requested: ${reqHours}h. Reason: ${reason}`,
        source_user_id: entry.setter_id,
        source_entity_id: editRequest.id,
      });

      return Response.json({ success: true, request_id: editRequest.id });

    } else if (action === 'get_my_requests') {
      const { setter_id } = body;
      if (!setter_id) {
        return Response.json({ error: 'Missing setter_id' }, { status: 400 });
      }

      const requests = await sr.entities.TimeEntryEditRequest.filter({ setter_id }, '-created_date', 20);
      return Response.json({ requests });

    } else if (action === 'get_pending') {
      if (!isAdmin) {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }

      const pending = await sr.entities.TimeEntryEditRequest.filter({ status: 'pending' }, 'created_date', 100);

      // Enrich with setter names if missing
      const needNames = pending.filter(r => !r.setter_name);
      if (needNames.length > 0) {
        const allUsers = await sr.entities.User.filter({}, '-created_date', 500);
        const nameMap = {};
        allUsers.forEach(u => { nameMap[u.id] = u.full_name || u.email; });
        pending.forEach(r => {
          if (!r.setter_name) r.setter_name = nameMap[r.setter_id] || 'Unknown';
        });
      }

      return Response.json({ pending });

    } else if (action === 'approve') {
      if (!isAdmin) {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }

      const { request_id, admin_notes } = body;
      if (!request_id) {
        return Response.json({ error: 'Missing request_id' }, { status: 400 });
      }

      // Fetch the edit request
      const allReqs = await sr.entities.TimeEntryEditRequest.filter({}, '-created_date', 500);
      const editReq = allReqs.find(r => r.id === request_id);
      if (!editReq) {
        return Response.json({ error: 'Edit request not found' }, { status: 404 });
      }
      if (editReq.status !== 'pending') {
        return Response.json({ error: 'Request is not pending' }, { status: 400 });
      }

      // Update the actual TimeEntry
      await sr.entities.TimeEntry.update(editReq.time_entry_id, {
        clock_in: editReq.requested_clock_in,
        clock_out: editReq.requested_clock_out,
        total_hours: editReq.requested_total_hours,
      });

      // Update the edit request
      await sr.entities.TimeEntryEditRequest.update(request_id, {
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      });

      // Notify setter
      const entryDate = editReq.original_clock_in ? editReq.original_clock_in.split('T')[0] : 'unknown date';
      const newHours = editReq.requested_total_hours ? editReq.requested_total_hours.toFixed(2) : 'N/A';

      await sr.functions.invoke('sendAppNotification', {
        recipient_role: 'setter',
        recipient_user_id: editReq.setter_id,
        type: 'time_entry_edit_approved',
        title: '✅ Clock Edit Approved',
        message: `Your clock edit request for ${entryDate} has been approved. Updated to ${newHours}h.`,
        source_user_id: user.id,
        source_entity_id: request_id,
      });

      return Response.json({ success: true });

    } else if (action === 'deny') {
      if (!isAdmin) {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }

      const { request_id, admin_notes } = body;
      if (!request_id) {
        return Response.json({ error: 'Missing request_id' }, { status: 400 });
      }

      // Fetch the edit request
      const allReqs = await sr.entities.TimeEntryEditRequest.filter({}, '-created_date', 500);
      const editReq = allReqs.find(r => r.id === request_id);
      if (!editReq) {
        return Response.json({ error: 'Edit request not found' }, { status: 404 });
      }
      if (editReq.status !== 'pending') {
        return Response.json({ error: 'Request is not pending' }, { status: 400 });
      }

      // Update the edit request
      await sr.entities.TimeEntryEditRequest.update(request_id, {
        status: 'denied',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      });

      // Notify setter
      const entryDate = editReq.original_clock_in ? editReq.original_clock_in.split('T')[0] : 'unknown date';
      const denyMsg = `Your clock edit request for ${entryDate} was denied.${admin_notes ? ' Reason: ' + admin_notes : ''}`;

      await sr.functions.invoke('sendAppNotification', {
        recipient_role: 'setter',
        recipient_user_id: editReq.setter_id,
        type: 'time_entry_edit_denied',
        title: '❌ Clock Edit Denied',
        message: denyMsg,
        source_user_id: user.id,
        source_entity_id: request_id,
      });

      return Response.json({ success: true });

    } else {
      return Response.json({ error: 'Invalid action. Use: request_edit, get_my_requests, get_pending, approve, deny' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});