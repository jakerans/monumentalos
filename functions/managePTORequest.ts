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

    // Helper: get user name map
    async function getUserNameMap(ids) {
      if (!ids.length) return {};
      const allUsers = await sr.entities.User.filter({}, '-created_date', 500);
      const map = {};
      allUsers.forEach(u => { map[u.id] = u.full_name || u.email; });
      return map;
    }

    if (action === 'get_available_covers') {
      const { request_date, setter_id } = body;
      if (!request_date || !setter_id) {
        return Response.json({ error: 'Missing request_date or setter_id' }, { status: 400 });
      }
      const allSchedules = await sr.entities.SetterSchedule.filter({}, '-date', 2000);
      const daySchedules = allSchedules.filter(s => s.date === request_date && s.status === 'scheduled' && s.setter_id !== setter_id);
      
      if (daySchedules.length === 0) {
        return Response.json({ available_covers: [] });
      }

      const nameMap = await getUserNameMap(daySchedules.map(s => s.setter_id));
      const available_covers = daySchedules.map(s => ({
        setter_id: s.setter_id,
        full_name: nameMap[s.setter_id] || 'Unknown',
        shift_start: s.shift_start,
        shift_end: s.shift_end,
      }));

      return Response.json({ available_covers });

    } else if (action === 'create_request') {
      const { setter_id, request_date, cover_setter_id, notes,
              offer_type: rawOfferType, offer_quantity: rawOfferQty, offer_loot_box_ids: rawBoxIds } = body;
      if (!setter_id || !request_date) {
        return Response.json({ error: 'Missing setter_id or request_date' }, { status: 400 });
      }

      const offerType = rawOfferType || 'none';
      let offerQuantity = rawOfferQty || 0;
      let offerBoxIdsStr = '';

      // Check PTO balance — need enough for the day off plus any PTO offer
      const ptoBanks = await sr.entities.PaidDayOffBank.filter({ setter_id }, '-created_date', 1);
      const bank = ptoBanks.length > 0 ? ptoBanks[0] : null;
      const available = bank ? (bank.days_earned || 0) - (bank.days_used || 0) : 0;

      if (offerType === 'pto_days') {
        if (!offerQuantity || offerQuantity < 1) {
          return Response.json({ error: 'offer_quantity must be at least 1 for pto_days', insufficient_pto: true }, { status: 400 });
        }
        const totalNeeded = 1 + offerQuantity;
        if (available < totalNeeded) {
          return Response.json({ error: 'Insufficient PTO balance for request plus offer', insufficient_pto: true }, { status: 400 });
        }
      } else {
        if (available < 1) {
          return Response.json({ error: 'Insufficient PTO balance', insufficient_pto: true }, { status: 400 });
        }
      }

      if (offerType === 'loot_boxes') {
        const boxIds = Array.isArray(rawBoxIds) ? rawBoxIds : [];
        if (boxIds.length === 0) {
          return Response.json({ error: 'offer_loot_box_ids must be a non-empty array', invalid_boxes: true }, { status: 400 });
        }
        // Validate each box
        const allBoxes = await sr.entities.LootBox.filter({ setter_id }, '-awarded_date', 500);
        const boxMap = {};
        allBoxes.forEach(b => { boxMap[b.id] = b; });
        for (const bid of boxIds) {
          const box = boxMap[bid];
          if (!box || box.status !== 'unopened' || box.setter_id !== setter_id) {
            return Response.json({ error: 'One or more selected loot boxes are invalid', invalid_boxes: true }, { status: 400 });
          }
        }
        offerQuantity = boxIds.length;
        offerBoxIdsStr = boxIds.join(',');
      }

      // Check for duplicate
      const existingRequests = await sr.entities.PTORequest.filter({ setter_id }, '-created_date', 200);
      const dup = existingRequests.find(r => r.request_date === request_date && r.status !== 'cancelled' && r.status !== 'denied');
      if (dup) {
        return Response.json({ error: 'Request already exists for this date', duplicate: true }, { status: 400 });
      }

      const newRequest = {
        setter_id,
        request_date,
        notes: notes || '',
        days_deducted: 1,
        offer_type: offerType,
        offer_quantity: offerQuantity,
        offer_loot_box_ids: offerBoxIdsStr,
      };

      if (cover_setter_id) {
        newRequest.cover_setter_id = cover_setter_id;
        newRequest.status = 'pending_cover';
        newRequest.cover_accepted = false;
      } else {
        newRequest.status = 'pending_admin';
      }

      const created = await sr.entities.PTORequest.create(newRequest);
      return Response.json({ success: true, request_id: created.id, status: newRequest.status });

    } else if (action === 'respond_cover') {
      const { request_id, accepted } = body;
      if (!request_id || accepted === undefined) {
        return Response.json({ error: 'Missing request_id or accepted' }, { status: 400 });
      }

      const allReqs = await sr.entities.PTORequest.filter({}, '-created_date', 500);
      const request = allReqs.find(r => r.id === request_id);
      if (!request) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
      }
      if (request.status !== 'pending_cover') {
        return Response.json({ error: 'Request is not pending cover response' }, { status: 400 });
      }

      // Verify user is the cover setter or admin
      if (!isAdmin && request.cover_setter_id !== user.id) {
        return Response.json({ error: 'Not authorized to respond to this request' }, { status: 403 });
      }

      if (accepted) {
        await sr.entities.PTORequest.update(request_id, { cover_accepted: true, status: 'pending_admin' });
        return Response.json({ success: true, new_status: 'pending_admin' });
      } else {
        const existingNotes = request.notes || '';
        const newNotes = existingNotes ? existingNotes + '\nCover declined — awaiting admin assignment.' : 'Cover declined — awaiting admin assignment.';
        await sr.entities.PTORequest.update(request_id, {
          cover_accepted: false,
          cover_setter_id: null,
          status: 'pending_admin',
          notes: newNotes,
        });
        return Response.json({ success: true, new_status: 'pending_admin' });
      }

    } else if (action === 'admin_resolve') {
      if (!isAdmin) {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
      const { request_id, decision, admin_notes, override_cover_setter_id } = body;
      if (!request_id || !decision) {
        return Response.json({ error: 'Missing request_id or decision' }, { status: 400 });
      }

      const allReqs = await sr.entities.PTORequest.filter({}, '-created_date', 500);
      const request = allReqs.find(r => r.id === request_id);
      if (!request) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
      }
      if (request.status !== 'pending_admin') {
        return Response.json({ error: 'Request is not pending admin resolution' }, { status: 400 });
      }

      if (decision === 'denied') {
        const updates = { status: 'denied' };
        if (admin_notes) {
          const existing = request.notes || '';
          updates.notes = existing ? existing + '\nAdmin: ' + admin_notes : 'Admin: ' + admin_notes;
        }
        await sr.entities.PTORequest.update(request_id, updates);
        return Response.json({ success: true, status: 'denied' });
      }

      if (decision === 'approved') {
        // Override cover if provided
        let coverSetterId = request.cover_setter_id;
        if (override_cover_setter_id) {
          coverSetterId = override_cover_setter_id;
          await sr.entities.PTORequest.update(request_id, {
            cover_setter_id: override_cover_setter_id,
            cover_accepted: true,
          });
        }

        // Approve
        const approveUpdates = { status: 'approved', admin_approved: true };
        if (admin_notes) {
          const existing = request.notes || '';
          approveUpdates.notes = existing ? existing + '\nAdmin: ' + admin_notes : 'Admin: ' + admin_notes;
        }
        await sr.entities.PTORequest.update(request_id, approveUpdates);

        // Update requesting setter's schedule
        const requestDate = request.request_date;
        const setterId = request.setter_id;
        const allSchedules = await sr.entities.SetterSchedule.filter({ setter_id: setterId }, '-date', 500);
        const setterSchedule = allSchedules.find(s => s.date === requestDate);

        let originalShiftStart = null;
        let originalShiftEnd = null;

        if (setterSchedule) {
          originalShiftStart = setterSchedule.shift_start;
          originalShiftEnd = setterSchedule.shift_end;
          const schedUpdate = { status: 'pto' };
          if (coverSetterId) schedUpdate.cover_setter_id = coverSetterId;
          await sr.entities.SetterSchedule.update(setterSchedule.id, schedUpdate);
        } else {
          const newSched = { setter_id: setterId, date: requestDate, status: 'pto', shift_start: null, shift_end: null };
          if (coverSetterId) newSched.cover_setter_id = coverSetterId;
          await sr.entities.SetterSchedule.create(newSched);
        }

        // Handle cover setter schedule
        if (coverSetterId) {
          const coverSchedules = await sr.entities.SetterSchedule.filter({ setter_id: coverSetterId }, '-date', 500);
          const coverSched = coverSchedules.find(s => s.date === requestDate);
          if (coverSched) {
            await sr.entities.SetterSchedule.update(coverSched.id, {
              status: 'covered',
              shift_start: originalShiftStart || coverSched.shift_start,
              shift_end: originalShiftEnd || coverSched.shift_end,
            });
          } else {
            await sr.entities.SetterSchedule.create({
              setter_id: coverSetterId,
              date: requestDate,
              status: 'covered',
              shift_start: originalShiftStart,
              shift_end: originalShiftEnd,
            });
          }
        }

        // Deduct PTO for the day off
        const ptoBanks = await sr.entities.PaidDayOffBank.filter({ setter_id: setterId }, '-created_date', 1);
        if (ptoBanks.length > 0) {
          const bank = ptoBanks[0];
          await sr.entities.PaidDayOffBank.update(bank.id, {
            days_used: (bank.days_used || 0) + (request.days_deducted || 1),
            last_updated: new Date().toISOString(),
          });
        }

        // Inventory transfer on approval — only if there's a cover setter
        if (coverSetterId && request.offer_type === 'pto_days' && request.offer_quantity > 0) {
          // Deduct offer from requester's bank (additional to days_deducted above)
          const reqBanks = await sr.entities.PaidDayOffBank.filter({ setter_id: setterId }, '-created_date', 1);
          if (reqBanks.length > 0) {
            await sr.entities.PaidDayOffBank.update(reqBanks[0].id, {
              days_used: (reqBanks[0].days_used || 0) + request.offer_quantity,
              last_updated: new Date().toISOString(),
            });
          }
          // Credit cover setter's bank
          const coverBanks = await sr.entities.PaidDayOffBank.filter({ setter_id: coverSetterId }, '-created_date', 1);
          if (coverBanks.length > 0) {
            await sr.entities.PaidDayOffBank.update(coverBanks[0].id, {
              days_earned: (coverBanks[0].days_earned || 0) + request.offer_quantity,
              last_updated: new Date().toISOString(),
            });
          } else {
            await sr.entities.PaidDayOffBank.create({
              setter_id: coverSetterId,
              days_earned: request.offer_quantity,
              days_used: 0,
              last_updated: new Date().toISOString(),
            });
          }
        }

        if (coverSetterId && request.offer_type === 'loot_boxes' && request.offer_loot_box_ids) {
          const boxIds = request.offer_loot_box_ids.split(',').filter(Boolean);
          for (const boxId of boxIds) {
            await sr.entities.LootBox.update(boxId, { setter_id: coverSetterId });
          }
        }

        return Response.json({ success: true, status: 'approved' });
      }

      return Response.json({ error: 'Invalid decision' }, { status: 400 });

    } else if (action === 'cancel') {
      const { request_id } = body;
      if (!request_id) {
        return Response.json({ error: 'Missing request_id' }, { status: 400 });
      }

      const allReqs = await sr.entities.PTORequest.filter({}, '-created_date', 500);
      const request = allReqs.find(r => r.id === request_id);
      if (!request) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
      }

      // Verify ownership or admin
      if (!isAdmin && request.setter_id !== user.id) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      if (request.status === 'approved') {
        return Response.json({ error: 'Cannot cancel approved request — contact admin', already_approved: true }, { status: 400 });
      }

      await sr.entities.PTORequest.update(request_id, { status: 'cancelled' });
      return Response.json({ success: true });

    } else if (action === 'get_my_requests') {
      const { setter_id } = body;
      if (!setter_id) {
        return Response.json({ error: 'Missing setter_id' }, { status: 400 });
      }

      const requests = await sr.entities.PTORequest.filter({ setter_id }, '-created_date', 50);
      
      // Get cover setter names
      const coverIds = [...new Set(requests.filter(r => r.cover_setter_id).map(r => r.cover_setter_id))];
      const nameMap = await getUserNameMap(coverIds);
      
      const enriched = requests.map(r => ({
        ...r,
        cover_setter_name: r.cover_setter_id ? (nameMap[r.cover_setter_id] || null) : null,
      }));

      return Response.json({ requests: enriched });

    } else if (action === 'get_pending_covers') {
      const { setter_id } = body;
      if (!setter_id) {
        return Response.json({ error: 'Missing setter_id' }, { status: 400 });
      }

      const allReqs = await sr.entities.PTORequest.filter({ status: 'pending_cover' }, '-created_date', 100);
      const pending = allReqs.filter(r => r.cover_setter_id === setter_id);

      // Get requesting setter names + shift info
      const requesterIds = [...new Set(pending.map(r => r.setter_id))];
      const nameMap = await getUserNameMap(requesterIds);

      // Get schedule info for the request dates
      const allSchedules = await sr.entities.SetterSchedule.filter({}, '-date', 2000);

      // Resolve loot box details for offers
      const allBoxIds = [];
      pending.forEach(r => {
        if (r.offer_type === 'loot_boxes' && r.offer_loot_box_ids) {
          r.offer_loot_box_ids.split(',').filter(Boolean).forEach(id => allBoxIds.push(id));
        }
      });
      let boxMap = {};
      if (allBoxIds.length > 0) {
        const allBoxes = await sr.entities.LootBox.filter({}, '-awarded_date', 2000);
        allBoxes.forEach(b => { boxMap[b.id] = b; });
      }

      const enriched = pending.map(r => {
        const requesterSchedule = allSchedules.find(s => s.setter_id === r.setter_id && s.date === r.request_date);
        let offer_details = null;
        if (r.offer_type === 'pto_days' && r.offer_quantity > 0) {
          offer_details = { type: 'pto_days', quantity: r.offer_quantity };
        } else if (r.offer_type === 'loot_boxes' && r.offer_loot_box_ids) {
          const ids = r.offer_loot_box_ids.split(',').filter(Boolean);
          const loot_boxes = ids.map(id => ({ id, rarity: boxMap[id]?.rarity || 'common' }));
          offer_details = { type: 'loot_boxes', quantity: ids.length, loot_boxes };
        }
        return {
          ...r,
          requester_name: nameMap[r.setter_id] || 'Unknown',
          shift_start: requesterSchedule?.shift_start || null,
          shift_end: requesterSchedule?.shift_end || null,
          offer_details,
        };
      });

      return Response.json({ pending_covers: enriched });

    } else if (action === 'get_admin_queue') {
      if (!isAdmin) {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }

      const allReqs = await sr.entities.PTORequest.filter({ status: 'pending_admin' }, 'request_date', 100);
      
      // Get all user names
      const allUserIds = [...new Set([
        ...allReqs.map(r => r.setter_id),
        ...allReqs.filter(r => r.cover_setter_id).map(r => r.cover_setter_id),
      ])];
      const nameMap = await getUserNameMap(allUserIds);

      // Resolve loot box details for offers
      const allBoxIds = [];
      allReqs.forEach(r => {
        if (r.offer_type === 'loot_boxes' && r.offer_loot_box_ids) {
          r.offer_loot_box_ids.split(',').filter(Boolean).forEach(id => allBoxIds.push(id));
        }
      });
      let boxMap = {};
      if (allBoxIds.length > 0) {
        const allBoxes = await sr.entities.LootBox.filter({}, '-awarded_date', 2000);
        allBoxes.forEach(b => { boxMap[b.id] = b; });
      }

      const enriched = allReqs.map(r => {
        let offer_details = null;
        if (r.offer_type === 'pto_days' && r.offer_quantity > 0) {
          offer_details = { type: 'pto_days', quantity: r.offer_quantity };
        } else if (r.offer_type === 'loot_boxes' && r.offer_loot_box_ids) {
          const ids = r.offer_loot_box_ids.split(',').filter(Boolean);
          const loot_boxes = ids.map(id => ({ id, rarity: boxMap[id]?.rarity || 'common' }));
          offer_details = { type: 'loot_boxes', quantity: ids.length, loot_boxes };
        }
        return {
          ...r,
          setter_name: nameMap[r.setter_id] || 'Unknown',
          cover_setter_name: r.cover_setter_id ? (nameMap[r.cover_setter_id] || null) : null,
          offer_details,
        };
      });

      return Response.json({ queue: enriched });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});