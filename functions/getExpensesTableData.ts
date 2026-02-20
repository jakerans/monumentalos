import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entity, filter, sort, limit = 200) {
  const results = [];
  let skip = 0;
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
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { startDate, endDate, filterCat, filterType, search, skip = 0, limit = 50, sortField = 'date', sortDir = 'desc' } = body;

    // Fetch all expenses in range + active clients in parallel
    const [allExpenses, clients] = await Promise.all([
      fetchAll(base44.entities.Expense, {}, '-date'),
      fetchAll(base44.entities.Client, {}, 'name'),
    ]);

    // Client lookup
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c.name; });

    // Date filter + exclude distributions
    const rangeExpenses = allExpenses.filter(e => {
      if (!e.date || e.expense_type === 'distribution') return false;
      return e.date >= startDate && e.date <= endDate;
    });

    // ── KPIs on full range (before category/type filters) ──
    let total = 0, cogsTotal = 0, overheadTotal = 0;
    const byCategoryMap = {};
    for (const e of rangeExpenses) {
      const amt = e.amount || 0;
      total += amt;
      if (e.expense_type === 'cogs') cogsTotal += amt;
      else if (e.expense_type === 'overhead') overheadTotal += amt;
      const cat = e.category || 'other';
      byCategoryMap[cat] = (byCategoryMap[cat] || 0) + amt;
    }
    const byCategory = Object.entries(byCategoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // ── Apply user filters ──
    let filtered = rangeExpenses;
    if (filterCat && filterCat !== 'all') {
      if (filterCat === 'uncategorized') {
        filtered = filtered.filter(e => !e.category || e.category === 'uncategorized');
      } else {
        filtered = filtered.filter(e => e.category === filterCat);
      }
    }
    if (filterType && filterType !== 'all') {
      if (filterType === 'uncategorized') {
        filtered = filtered.filter(e => !e.expense_type || e.expense_type === 'uncategorized');
      } else {
        filtered = filtered.filter(e => e.expense_type === filterType);
      }
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(e => {
        const desc = (e.description || '').toLowerCase();
        const vendor = (e.vendor || '').toLowerCase();
        const clientName = (e.client_id ? (clientMap[e.client_id] || '') : '').toLowerCase();
        return desc.includes(q) || vendor.includes(q) || clientName.includes(q);
      });
    }

    // ── Server-side sort ──
    filtered.sort((a, b) => {
      // Pending AI actions always on top
      const aPending = !a.ai_approved && a.suggested_category ? 1 : 0;
      const bPending = !b.ai_approved && b.suggested_category ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;

      let aVal, bVal;
      switch (sortField) {
        case 'date': aVal = a.date || ''; bVal = b.date || ''; break;
        case 'amount': aVal = a.amount || 0; bVal = b.amount || 0; break;
        case 'category': aVal = (a.category || '').toLowerCase(); bVal = (b.category || '').toLowerCase(); break;
        case 'expense_type': aVal = (a.expense_type || '').toLowerCase(); bVal = (b.expense_type || '').toLowerCase(); break;
        case 'vendor': aVal = (a.vendor || '').toLowerCase(); bVal = (b.vendor || '').toLowerCase(); break;
        case 'client_id': aVal = (clientMap[a.client_id] || '').toLowerCase(); bVal = (clientMap[b.client_id] || '').toLowerCase(); break;
        default: aVal = a.date || ''; bVal = b.date || '';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalFiltered = filtered.length;
    const filteredTotal = filtered.reduce((s, e) => s + (e.amount || 0), 0);

    // ── Paginate ──
    const page = filtered.slice(skip, skip + limit);
    const expenses = page.map(e => ({
      ...e,
      client_name: e.client_id ? (clientMap[e.client_id] || '') : '',
    }));

    console.log(`[getExpensesTableData] range=${rangeExpenses.length} filtered=${totalFiltered} page=${expenses.length} skip=${skip}`);

    return Response.json({
      kpis: { total, cogsTotal, overheadTotal },
      byCategory,
      expenses,
      totalFiltered,
      filteredTotal,
      clients: clients.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});