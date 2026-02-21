import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const targetPeriod = body.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const sr = base44.asServiceRole.entities;

    const [allUsers, allSpiffs, allLootWins] = await Promise.all([
      sr.User.list('-created_date', 5000),
      sr.Spiff.list('-created_date', 5000),
      (async () => {
        const [pending, approved] = await Promise.all([
          sr.LootWin.filter({ fulfillment_status: 'pending', prize_type: 'cash' }, '-won_date', 5000),
          sr.LootWin.filter({ fulfillment_status: 'approved', prize_type: 'cash' }, '-won_date', 5000),
        ]);
        return [...pending, ...approved];
      })(),
    ]);

    const setters = allUsers.filter(u => u.app_role === 'setter');

    const completedSpiffs = allSpiffs.filter(s =>
      s.status === 'completed' &&
      s.due_date &&
      s.due_date.startsWith(targetPeriod)
    );

    const individualSpiffs = completedSpiffs.filter(s => s.scope === 'individual');
    const teamEachSpiffs = completedSpiffs.filter(s => s.scope === 'team_each');
    const teamCompanySpiffs = completedSpiffs.filter(s => s.scope === 'team_company');

    const setterSummaries = setters.map(setter => {
      const mySpiffItems = [
        ...individualSpiffs
          .filter(s => s.assigned_setter_id === setter.id)
          .map(s => ({ id: s.id, title: s.title, reward: s.reward, cash_value: s.cash_value || 0, scope: 'individual', due_date: s.due_date })),
        ...teamEachSpiffs
          .map(s => ({ id: s.id, title: s.title, reward: s.reward, cash_value: s.cash_value || 0, scope: 'team_each', due_date: s.due_date })),
      ];

      const myLootItems = allLootWins
        .filter(w => w.setter_id === setter.id)
        .map(w => ({ id: w.id, prize_name: w.prize_name, rarity: w.rarity, cash_value: w.cash_value || 0, won_date: w.won_date, fulfillment_status: w.fulfillment_status }));

      const spiff_total = mySpiffItems.reduce((s, i) => s + (i.cash_value || 0), 0);
      const loot_total = myLootItems.reduce((s, i) => s + (i.cash_value || 0), 0);
      const total = spiff_total + loot_total;

      return { setter_id: setter.id, setter_name: setter.full_name || setter.email, spiff_items: mySpiffItems, loot_items: myLootItems, spiff_total, loot_total, total };
    }).filter(s => s.total > 0 || s.spiff_items.length > 0 || s.loot_items.length > 0);

    const teamBonuses = teamCompanySpiffs.map(s => ({ id: s.id, title: s.title, reward: s.reward, cash_value: s.cash_value || 0, due_date: s.due_date }));

    return Response.json({ setterSummaries, teamBonuses, period: targetPeriod });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});