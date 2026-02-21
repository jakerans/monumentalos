import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { selectedMonth, page = 0, pageSize = 50, action } = await req.json();
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);

    const sr = base44.asServiceRole.entities;

    // ========== ACTION: Generate billing records server-side ==========
    if (action === 'generate') {
      const [clients, existingBilling] = await Promise.all([
        sr.Client.list(),
        fetchAllFiltered(sr.MonthlyBilling, { billing_month: selectedMonth }, '-billing_month'),
      ]);

      const activeClients = clients.filter(c => c.status === 'active');
      const hybridWithRecord = new Set();
      const nonHybridWithRecord = new Set();
      existingBilling.forEach(r => {
        const c = clients.find(cl => cl.id === r.client_id);
        if (c?.billing_type === 'hybrid') hybridWithRecord.add(r.client_id);
        else nonHybridWithRecord.add(r.client_id);
      });
      const missingClients = activeClients.filter(c =>
        c.billing_type === 'hybrid' ? !hybridWithRecord.has(c.id) : !nonHybridWithRecord.has(c.id)
      );

      if (missingClients.length === 0) {
        return Response.json({ generated: 0 });
      }

      // Fetch leads for this billing month
      const monthStart = new Date(selYear, selMonth - 1, 1).toISOString();
      const monthEnd = new Date(selYear, selMonth, 0, 23, 59, 59).toISOString();
      const leads = await fetchAllFiltered(sr.Lead, {
        $or: [
          { appointment_date: { $gte: monthStart, $lte: monthEnd } },
          { date_appointment_set: { $gte: monthStart, $lte: monthEnd } }
        ]
      }, '-created_date');

      const monthStartDate = new Date(selYear, selMonth - 1, 1);
      const monthEndDate = new Date(selYear, selMonth, 0, 23, 59, 59);

      const records = missingClients.map(client => {
        const bt = client.billing_type || 'pay_per_show';
        const cLeads = leads.filter(l => l.client_id === client.id);
        const pricing = client.industry_pricing || [];

        let quantity = 0;
        let calculatedAmount = 0;
        let rate = 0;

        if (bt === 'pay_per_show') {
          const showed = cLeads.filter(l =>
            l.disposition === 'showed' && l.appointment_date &&
            new Date(l.appointment_date) >= monthStartDate && new Date(l.appointment_date) <= monthEndDate
          );
          quantity = showed.length;
          showed.forEach(lead => {
            const ind = (lead.industries && lead.industries[0]) || null;
            const match = ind ? pricing.find(p => p.industry === ind) : null;
            calculatedAmount += (match ? (match.price_per_show || 0) : (client.price_per_shown_appointment || 0));
          });
          rate = quantity > 0 ? Math.round((calculatedAmount / quantity) * 100) / 100 : 0;
        } else if (bt === 'pay_per_set') {
          const booked = cLeads.filter(l =>
            l.date_appointment_set &&
            new Date(l.date_appointment_set) >= monthStartDate && new Date(l.date_appointment_set) <= monthEndDate
          );
          quantity = booked.length;
          booked.forEach(lead => {
            const ind = (lead.industries && lead.industries[0]) || null;
            const match = ind ? pricing.find(p => p.industry === ind) : null;
            calculatedAmount += (match ? (match.price_per_set || 0) : (client.price_per_set_appointment || 0));
          });
          rate = quantity > 0 ? Math.round((calculatedAmount / quantity) * 100) / 100 : 0;
        } else if (bt === 'retainer') {
          rate = client.retainer_amount || 0;
          calculatedAmount = rate;
        }

        if (bt === 'hybrid') {
          // Generate two records for hybrid clients
          const hybridRecords = [];
          // 1. Retainer record
          const retainerRate = client.hybrid_base_retainer || 0;
          hybridRecords.push({
            client_id: client.id,
            billing_month: selectedMonth,
            billing_type: 'hybrid_retainer',
            calculated_amount: retainerRate,
            quantity: 0,
            rate: retainerRate,
            status: 'pending',
          });
          // 2. Performance record
          const perfType = client.hybrid_performance_type || 'pay_per_set';
          const perfPricing = client.hybrid_performance_pricing || [];
          let perfQty = 0;
          let perfAmount = 0;
          if (perfType === 'pay_per_show') {
            const showed = cLeads.filter(l =>
              l.disposition === 'showed' && l.appointment_date &&
              new Date(l.appointment_date) >= monthStartDate && new Date(l.appointment_date) <= monthEndDate
            );
            perfQty = showed.length;
            showed.forEach(lead => {
              const ind = (lead.industries && lead.industries[0]) || null;
              const match = ind ? perfPricing.find(p => p.industry === ind) : null;
              perfAmount += match ? (match.price_per_show || 0) : 0;
            });
          } else {
            const booked = cLeads.filter(l =>
              l.date_appointment_set &&
              new Date(l.date_appointment_set) >= monthStartDate && new Date(l.date_appointment_set) <= monthEndDate
            );
            perfQty = booked.length;
            booked.forEach(lead => {
              const ind = (lead.industries && lead.industries[0]) || null;
              const match = ind ? perfPricing.find(p => p.industry === ind) : null;
              perfAmount += match ? (match.price_per_set || 0) : 0;
            });
          }
          if (perfQty > 0) {
            hybridRecords.push({
              client_id: client.id,
              billing_month: selectedMonth,
              billing_type: 'hybrid_performance',
              calculated_amount: perfAmount,
              quantity: perfQty,
              rate: perfQty > 0 ? Math.round((perfAmount / perfQty) * 100) / 100 : 0,
              status: 'pending',
            });
          }
          return hybridRecords;
        }

        return {
          client_id: client.id,
          billing_month: selectedMonth,
          billing_type: bt,
          calculated_amount: calculatedAmount,
          quantity,
          rate,
          status: 'pending',
        };
      });

      const flatRecords = records.flat();
      let createdIds = [];
      if (flatRecords.length > 0) {
        const created = await sr.MonthlyBilling.bulkCreate(flatRecords);
        createdIds = (created || []).map(r => r.id).filter(Boolean);
      }

      // Auto-flag overdue
      const now = new Date();
      const dueDate = new Date(selYear, selMonth, 5);
      if (now > dueDate) {
        const pendingRecords = existingBilling.filter(r => r.status === 'pending');
        for (const r of pendingRecords) {
          await sr.MonthlyBilling.update(r.id, { status: 'overdue' });
        }
      }

      return Response.json({ generated: flatRecords.length, createdIds });
    }

    // ========== DEFAULT: Return paginated billing data with pre-computed KPIs ==========
    const [clients, allBillingForMonth] = await Promise.all([
      sr.Client.list(),
      fetchAllFiltered(sr.MonthlyBilling, { billing_month: selectedMonth }, '-billing_month'),
    ]);

    // Build client lookup
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c; });

    // Overdue logic
    const now = new Date();
    const dueDate = new Date(selYear, selMonth, 5);
    const isOverdueMonth = now > dueDate;

    // ---- Compute KPIs server-side ----
    let totalAmount = 0;
    let totalPaid = 0;
    allBillingForMonth.forEach(record => {
      const amount = (record.billing_type === 'retainer' || record.billing_type === 'hybrid_retainer')
        ? (record.manual_amount || record.calculated_amount || 0)
        : (record.calculated_amount || 0);
      totalAmount += amount;
      if (record.status === 'paid') {
        totalPaid += (record.paid_amount || amount);
      }
    });
    const totalPending = totalAmount - totalPaid;

    // ---- Which active clients are missing billing records? ----
    const activeClients = clients.filter(c => c.status === 'active');
    const hybridClientsWithEitherRecord = new Set();
    const nonHybridClientsWithRecord = new Set();
    allBillingForMonth.forEach(r => {
      const client = clientMap[r.client_id];
      if (client?.billing_type === 'hybrid') {
        hybridClientsWithEitherRecord.add(r.client_id);
      } else {
        nonHybridClientsWithRecord.add(r.client_id);
      }
    });
    const missingClientCount = activeClients.filter(c => {
      if (c.billing_type === 'hybrid') {
        return !hybridClientsWithEitherRecord.has(c.id);
      }
      return !nonHybridClientsWithRecord.has(c.id);
    }).length;

    // ---- Paginate billing rows ----
    const totalCount = allBillingForMonth.length;
    const skip = page * pageSize;
    const pageRows = allBillingForMonth.slice(skip, skip + pageSize);

    // Enrich each row with client name, computed amount, and display status
    const rows = pageRows.map(record => {
      const client = clientMap[record.client_id];
      const amount = (record.billing_type === 'retainer' || record.billing_type === 'hybrid_retainer')
        ? (record.manual_amount || record.calculated_amount || 0)
        : (record.calculated_amount || 0);
      const displayStatus = (isOverdueMonth && record.status === 'pending') ? 'overdue' : record.status;
      const retainerDueDay = record.billing_type === 'hybrid_retainer'
        ? (client?.hybrid_retainer_due_day || null)
        : (client?.retainer_due_day || null);

      return {
        ...record,
        clientName: client?.name || '—',
        retainerDueDay,
        amount,
        displayStatus,
      };
    });

    return Response.json({
      kpis: { totalAmount, totalPaid, totalPending },
      rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      isOverdueMonth,
      missingClientCount,
      // Still need minimal client list for AdminNav
      clients: clients.map(c => ({ id: c.id, name: c.name, status: c.status })),
    });
  } catch (error) {
    console.error('getMonthlyBillingData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});