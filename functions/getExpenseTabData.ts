import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAllFiltered(entity, filter, sort) {
  const results = [];
  let skip = 0;
  const limit = 100;
  while (true) {
    const batch = await entity.filter(filter, sort, limit, skip);
    results.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.app_role !== 'admin' && user.app_role !== 'finance_admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { startDate, endDate, filterCat, filterType, skip = 0, limit = 50 } = body;

    // Fetch all expenses in range and clients in parallel
    let allExpenses = [];
    let clients = [];
    try {
      [allExpenses, clients] = await Promise.all([
        fetchAllFiltered(base44.entities.Expense, {}, '-date'),
        fetchAllFiltered(base44.entities.Client, {}, 'name'),
      ]);
    } catch (err) {
      // If one fails, still try the other
      if (allExpenses.length === 0) {
        try { allExpenses = await fetchAllFiltered(base44.entities.Expense, {}, '-date'); } catch (_) { allExpenses = []; }
      }
      if (clients.length === 0) {
        try { clients = await fetchAllFiltered(base44.entities.Client, {}, 'name'); } catch (_) { clients = []; }
      }
    }

    // Build client lookup
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c.name; });

    // Date filter
    const inRange = (d) => {
      if (!d) return false;
      return d >= startDate && d <= endDate;
    };

    // Exclude distributions from expense tab entirely
    const rangeExpenses = allExpenses.filter(e => inRange(e.date) && e.expense_type !== 'distribution');

    // Compute KPIs on range expenses (distributions excluded)
    const total = rangeExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const cogsTotal = rangeExpenses.filter(e => e.expense_type === 'cogs').reduce((s, e) => s + (e.amount || 0), 0);
    const overheadTotal = rangeExpenses.filter(e => e.expense_type === 'overhead').reduce((s, e) => s + (e.amount || 0), 0);

    // Category breakdown (distributions excluded)
    const byCategoryMap = {};
    rangeExpenses.forEach(e => {
      const cat = e.category || 'other';
      byCategoryMap[cat] = (byCategoryMap[cat] || 0) + (e.amount || 0);
    });
    const byCategory = Object.entries(byCategoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Apply user filters for the paginated list
    let filtered = rangeExpenses;
    if (filterCat && filterCat !== 'all') {
      filtered = filtered.filter(e => e.category === filterCat);
    }
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(e => e.expense_type === filterType);
    }

    // Sort by date descending
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const totalFiltered = filtered.length;

    // Server-side pagination
    const page = filtered.slice(skip, skip + limit);

    // Enrich with client name
    const expenses = page.map(e => ({
      ...e,
      client_name: e.client_id ? (clientMap[e.client_id] || '') : '',
    }));

    return Response.json({
      kpis: { total, cogsTotal, overheadTotal },
      byCategory,
      expenses,
      totalFiltered,
      clients: clients.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});