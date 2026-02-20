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
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'admin' && user.app_role !== 'onboard_admin' && user.role !== 'admin') {
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
      const existingClientIds = new Set(existingBilling.map(r => r.client_id));
      const missingClients = activeClients.filter(c => !existingClientIds.has(c.id));

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

      function getLeadPrice(client, lead) {
        const bt = client.billing_type || 'pay_per_show';
        const ip = client.industry_pricing || {};
        const defaultPrice = bt === 'pay_per_set' ? (client.price_per_set_appointment || 0) : (client.price_per_shown_appointment || 0);
        const li = lead.industries || [];
        if (li.length > 0 && Object.keys(ip).length > 0 && li[0] in ip && ip[li[0]] > 0) return ip[li[0]];
        return defaultPrice;
      }

      const records = missingClients.map(client => {
        const bt = client.billing_type || 'pay_per_show';
        const cLeads = leads.filter(l => l.client_id === client.id);

        let quantity = 0;
        let calculatedAmount = 0;

        if (bt === 'pay_per_show') {
          const showed = cLeads.filter(l =>
            l.disposition === 'showed' && l.appointment_date &&
            new Date(l.appointment_date) >= monthStartDate && new Date(l.appointment_date) <= monthEndDate
          );
          quantity = showed.length;
          calculatedAmount = showed.reduce((s, l) => s + getLeadPrice(client, l), 0);
        } else if (bt === 'pay_per_set') {
          const booked = cLeads.filter(l =>
            l.date_appointment_set &&
            new Date(l.date_appointment_set) >= monthStartDate && new Date(l.date_appointment_set) <= monthEndDate
          );
          quantity = booked.length;
          calculatedAmount = booked.reduce((s, l) => s + getLeadPrice(client, l), 0);
        } else if (bt === 'retainer') {
          calculatedAmount = client.retainer_amount || 0;
        }

        const rate = quantity > 0 ? Math.round(calculatedAmount / quantity * 100) / 100 : (bt === 'retainer' ? (client.retainer_amount || 0) : 0);

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

      if (records.length > 0) {
        await sr.MonthlyBilling.bulkCreate(records);
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

      return Response.json({ generated: records.length });
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
      const amount = record.billing_type === 'retainer'
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
    const existingClientIds = new Set(allBillingForMonth.map(r => r.client_id));
    const missingClientCount = activeClients.filter(c => !existingClientIds.has(c.id)).length;

    // ---- Paginate billing rows ----
    const totalCount = allBillingForMonth.length;
    const skip = page * pageSize;
    const pageRows = allBillingForMonth.slice(skip, skip + pageSize);

    // Enrich each row with client name, computed amount, and display status
    const rows = pageRows.map(record => {
      const client = clientMap[record.client_id];
      const amount = record.billing_type === 'retainer'
        ? (record.manual_amount || record.calculated_amount || 0)
        : (record.calculated_amount || 0);
      const displayStatus = (isOverdueMonth && record.status === 'pending') ? 'overdue' : record.status;

      return {
        ...record,
        clientName: client?.name || '—',
        retainerDueDay: client?.retainer_due_day || null,
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