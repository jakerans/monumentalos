import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, page = 0, page_size = 20, section = 'active' } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id is required' }, { status: 400 });
    }

    const role = user.app_role;
    if (role === 'admin' || role === 'onboard_admin') {
      // allowed
    } else if (role === 'client') {
      if (user.client_id !== client_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Paginated fetch helper
    async function fetchAllFiltered(entityRef, filter, sort, pageSize = 5000) {
      let all = [];
      let skip = 0;
      while (true) {
        const page = await entityRef.filter(filter, sort, pageSize, skip);
        all = all.concat(page);
        if (page.length < pageSize) break;
        skip += pageSize;
      }
      return all;
    }

    const sr = base44.asServiceRole.entities;

    // Fetch client info + all leads for this client in parallel
    const [clients, allLeads] = await Promise.all([
      sr.Client.filter({ id: client_id }),
      fetchAllFiltered(sr.Lead, { client_id }, '-created_date'),
    ]);

    const clientInfo = clients[0] || null;
    if (!clientInfo) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const isRetainer = clientInfo.billing_type === 'retainer';
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const staleThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Helper
    const inRange = (dateStr, start, end) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // ---- Filter leads based on billing type ----
    const visibleLeads = allLeads.filter(lead => {
      if (isRetainer) return true;
      return lead.status === 'appointment_booked' || lead.status === 'completed';
    });

    // ---- Compute KPIs (shared) ----
    const scheduledMTD = visibleLeads.filter(l => inRange(l.date_appointment_set, thisMonthStart, now)).length;

    const upcomingLeads = visibleLeads.filter(l =>
      l.appointment_date && new Date(l.appointment_date) > now &&
      (!l.disposition || l.disposition === 'scheduled' || l.disposition === 'rescheduled')
    );

    const showedMTD = visibleLeads.filter(l =>
      inRange(l.appointment_date, thisMonthStart, now) &&
      (l.disposition === 'showed' || l.outcome === 'sold' || l.outcome === 'lost')
    ).length;

    const needsOutcomeLeads = visibleLeads.filter(l =>
      l.appointment_date && new Date(l.appointment_date) <= now &&
      (!l.outcome || l.outcome === 'pending') &&
      l.disposition !== 'cancelled' && l.disposition !== 'rescheduled'
    );
    const needsOutcomeIds = new Set(needsOutcomeLeads.map(l => l.id));

    const dqLeads = isRetainer ? visibleLeads.filter(l => l.status === 'disqualified') : [];

    // Base KPIs (always present for backward compat)
    const kpis = {
      scheduledMTD,
      upcomingCount: upcomingLeads.length,
      showedMTD,
      needsOutcomeCount: needsOutcomeLeads.length,
      disqualifiedCount: dqLeads.length,
    };

    // ---- Retainer-specific KPIs ----
    if (isRetainer) {
      kpis.newCount = visibleLeads.filter(l => l.status === 'new').length;
      kpis.contactedCount = visibleLeads.filter(l => l.status === 'first_call_made' || l.status === 'contacted').length;
      kpis.bookedCount = visibleLeads.filter(l => l.status === 'appointment_booked').length;
      kpis.completedCount = visibleLeads.filter(l =>
        (l.outcome === 'sold' || l.outcome === 'lost') &&
        inRange(l.created_date, thisMonthStart, now)
      ).length;
      kpis.needsAttentionCount = visibleLeads.filter(l =>
        l.status === 'new' && l.created_date && new Date(l.created_date) < staleThreshold
      ).length;
    }

    // ---- Build the requested page of active leads ----
    let sectionLeads;
    if (section === 'active') {
      sectionLeads = visibleLeads.filter(lead => {
        if (isRetainer) {
          return lead.status !== 'disqualified' && lead.status !== 'completed' && lead.outcome !== 'sold' && lead.outcome !== 'lost';
        }
        const isUpcoming = lead.appointment_date && new Date(lead.appointment_date) > now &&
          (!lead.disposition || lead.disposition === 'scheduled' || lead.disposition === 'rescheduled');
        const isNeedsOutcome = needsOutcomeIds.has(lead.id);
        return isUpcoming || isNeedsOutcome;
      });

      if (isRetainer) {
        // Retainer priority sort: new → first_call_made → contacted → appointment_booked
        const statusOrder = { new: 0, first_call_made: 1, contacted: 2, appointment_booked: 3 };
        sectionLeads.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 99;
          const orderB = statusOrder[b.status] ?? 99;
          if (orderA !== orderB) return orderA - orderB;
          // Within appointment_booked, sort by appointment_date ascending
          if (a.status === 'appointment_booked' && b.status === 'appointment_booked') {
            const da = a.appointment_date ? new Date(a.appointment_date) : new Date('9999');
            const db = b.appointment_date ? new Date(b.appointment_date) : new Date('9999');
            return da - db;
          }
          // Everything else: newest first
          return new Date(b.created_date) - new Date(a.created_date);
        });
      } else {
        sectionLeads.sort((a, b) => {
          const aNO = needsOutcomeIds.has(a.id) ? 0 : 1;
          const bNO = needsOutcomeIds.has(b.id) ? 0 : 1;
          if (aNO !== bNO) return aNO - bNO;
          if (a.appointment_date && b.appointment_date) return new Date(a.appointment_date) - new Date(b.appointment_date);
          return new Date(b.created_date) - new Date(a.created_date);
        });
      }
    } else {
      sectionLeads = visibleLeads;
    }

    const totalCount = sectionLeads.length;
    const skip = page * page_size;
    const pageLeads = sectionLeads.slice(skip, skip + page_size);

    // Mark metadata flags on leads
    const pageLeadsWithMeta = pageLeads.map(l => ({
      ...l,
      _needsOutcome: needsOutcomeIds.has(l.id),
      _isStale: isRetainer && l.status === 'new' && l.created_date && new Date(l.created_date) < staleThreshold,
    }));

    return Response.json({
      clientInfo: {
        id: clientInfo.id,
        name: clientInfo.name,
        billing_type: clientInfo.billing_type,
      },
      kpis,
      leads: pageLeadsWithMeta,
      pagination: {
        page,
        page_size,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / page_size),
        has_more: skip + page_size < totalCount,
      },
      isRetainer,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});