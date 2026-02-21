import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entityRef, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityRef.list(sort, pageSize, skip);
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

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

    const sr = base44.asServiceRole.entities;

    const [prizes, pendingWins, settingsRecords, lootBoxes, users] = await Promise.all([
      fetchAll(sr.LootPrize, '-rarity'),
      fetchAllFiltered(sr.LootWin, { fulfillment_status: 'pending' }, '-won_date'),
      sr.LootSettings.list(),
      fetchAll(sr.LootBox, '-awarded_date'),
      sr.User.list('-created_date', 5000),
    ]);

    const settings = settingsRecords.length > 0 ? settingsRecords[0] : null;

    // Count loot boxes by rarity and status
    const inventoryStats = {
      common: { unopened: 0, opened: 0 },
      rare: { unopened: 0, opened: 0 },
      epic: { unopened: 0, opened: 0 },
      legendary: { unopened: 0, opened: 0 },
    };

    lootBoxes.forEach(box => {
      if (inventoryStats[box.rarity]) {
        if (box.status === 'unopened') {
          inventoryStats[box.rarity].unopened += 1;
        } else if (box.status === 'opened') {
          inventoryStats[box.rarity].opened += 1;
        }
      }
    });

    return Response.json({
      prizes,
      pendingWins,
      settings,
      inventoryStats,
      users,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});