import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function weightedPick(prizes) {
  const total = prizes.reduce((s, p) => s + (p.drop_weight || 1), 0);
  let roll = Math.random() * total;
  for (const p of prizes) {
    roll -= (p.drop_weight || 1);
    if (roll <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { loot_box_id, setter_id } = await req.json();
    if (!loot_box_id || !setter_id) {
      return Response.json({ error: 'loot_box_id and setter_id are required' }, { status: 400 });
    }

    if (user.app_role !== 'admin' && user.id !== setter_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole.entities;

    // Fetch the LootBox
    const allBoxes = await sr.LootBox.list('-created_date', 5000);
    const box = allBoxes.find(b => b.id === loot_box_id) || null;
    if (!box) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    if (box.status === 'opened') {
      return Response.json({ error: 'already_opened' }, { status: 409 });
    }

    // Fetch active prizes for this rarity
    const allPrizesForRarity = await sr.LootPrize.filter({ rarity: box.rarity }, '-drop_weight', 5000);
    const prizes = allPrizesForRarity.filter(p => p.is_active === true || p.is_active === 1);

    let selectedPrize;
    if (prizes.length === 0) {
      selectedPrize = {
        id: null,
        name: 'Mystery Prize',
        description: 'Contact your manager to claim',
        prize_type: 'physical',
        cash_value: 0,
        drop_weight: 1,
      };
    } else {
      selectedPrize = weightedPick(prizes);
    }

    const today = new Date().toISOString().split('T')[0];

    // Create LootWin record
    const lootWin = await sr.LootWin.create({
      setter_id,
      loot_box_id,
      prize_id: selectedPrize.id || 'none',
      prize_name: selectedPrize.name,
      prize_type: selectedPrize.prize_type,
      cash_value: selectedPrize.cash_value || 0,
      rarity: box.rarity,
      won_date: today,
      fulfillment_status: 'pending',
    });

    // Mark box as opened
    await sr.LootBox.update(box.id, {
      status: 'opened',
      opened_date: today,
    });

    return Response.json({
      success: true,
      lootWin,
      prize: selectedPrize,
    });
  } catch (error) {
    console.error('openLootBox error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});