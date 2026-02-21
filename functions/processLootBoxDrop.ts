import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DEFAULTS = {
  base_drop_rate: 5,
  dry_spell_threshold: 25,
  escalation_per_booking: 1,
  inventory_cap: 10,
  eligibility_stl_threshold_minutes: 5,
  rarity_weight_common: 65,
  rarity_weight_rare: 25,
  rarity_weight_epic: 8,
  rarity_weight_legendary: 2,
};

function pickRarity(settings) {
  const weights = [
    { rarity: 'common', weight: settings.rarity_weight_common ?? DEFAULTS.rarity_weight_common },
    { rarity: 'rare', weight: settings.rarity_weight_rare ?? DEFAULTS.rarity_weight_rare },
    { rarity: 'epic', weight: settings.rarity_weight_epic ?? DEFAULTS.rarity_weight_epic },
    { rarity: 'legendary', weight: settings.rarity_weight_legendary ?? DEFAULTS.rarity_weight_legendary },
  ];
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.rarity;
  }
  return 'common';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Step 1 — Auth & Input
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { setter_id, lead_id } = await req.json();
    if (!setter_id || !lead_id) {
      return Response.json({ error: 'setter_id and lead_id are required' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;

    // Step 2 — Load settings
    const settingsRecords = await sr.LootSettings.list('-created_date', 1);
    const raw = settingsRecords.length > 0 ? settingsRecords[0] : {};
    const settings = { ...DEFAULTS, ...raw };

    // Step 3 — Test mode check
    const today = new Date().toISOString().split('T')[0];

    if (settings.test_mode_enabled === true && settings.test_target_setter_id === setter_id) {
      const testRarity = settings.test_rarity_override || 'common';
      const newBox = await sr.LootBox.create({
        setter_id,
        rarity: testRarity,
        status: 'unopened',
        awarded_date: today,
        source: 'booking_drop',
        booking_id: lead_id,
      });

      // Update profile
      const profiles = await sr.SetterProfile.filter({ user_id: setter_id }, '-created_date', 1);
      if (profiles.length > 0) {
        await sr.SetterProfile.update(profiles[0].id, {
          consecutive_bookings_no_drop: 0,
          last_active_date: today,
        });
      }

      const unopened = await sr.LootBox.filter({ setter_id, status: 'unopened' }, '-created_date', 5000);
      return Response.json({
        dropped: true,
        eligible: true,
        rarity: testRarity,
        loot_box_id: newBox.id,
        inventory_count: unopened.length,
        test_mode: true,
      });
    }

    // Step 4 — Eligibility check
    const profiles = await sr.SetterProfile.filter({ user_id: setter_id }, '-created_date', 1);
    const profile = profiles.length > 0 ? profiles[0] : null;

    // Fetch setter's leads to determine last active day and STL
    const setterLeads = await sr.Lead.filter({ setter_id }, '-created_date', 500);

    // Find last active day across created_date, first_call_made_date, date_appointment_set
    let lastActiveDay = null;
    for (const lead of setterLeads) {
      const dates = [lead.created_date, lead.first_call_made_date, lead.date_appointment_set].filter(Boolean);
      for (const d of dates) {
        const dayStr = d.substring(0, 10);
        if (!lastActiveDay || dayStr > lastActiveDay) {
          lastActiveDay = dayStr;
        }
      }
    }

    if (lastActiveDay) {
      // Get leads that arrived on that day with STL data
      const lastDayLeads = setterLeads.filter(l => {
        const createdDay = l.created_date ? l.created_date.substring(0, 10) : null;
        return createdDay === lastActiveDay && l.speed_to_lead_minutes != null;
      });

      if (lastDayLeads.length > 0) {
        const avgSTL = lastDayLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / lastDayLeads.length;
        if (avgSTL > settings.eligibility_stl_threshold_minutes) {
          return Response.json({ dropped: false, reason: 'not_eligible', eligible: false });
        }
      }
      // If no STL data on last active day, eligible by default
    }

    // Step 5 — Inventory check
    const unopenedBoxes = await sr.LootBox.filter({ setter_id, status: 'unopened' }, '-created_date', 5000);
    if (unopenedBoxes.length >= settings.inventory_cap) {
      return Response.json({ dropped: false, reason: 'inventory_full', eligible: true });
    }

    // Step 6 — Probability roll
    const consecutive = profile ? (profile.consecutive_bookings_no_drop || 0) : 0;
    let effectiveRate = settings.base_drop_rate;
    if (consecutive >= settings.dry_spell_threshold) {
      effectiveRate = settings.base_drop_rate + ((consecutive - settings.dry_spell_threshold) * settings.escalation_per_booking);
    }
    effectiveRate = Math.min(effectiveRate, 95);

    const roll = Math.random() * 100;
    if (roll > effectiveRate) {
      // No drop — increment dry spell counter
      const newConsecutive = consecutive + 1;
      if (profile) {
        await sr.SetterProfile.update(profile.id, {
          consecutive_bookings_no_drop: newConsecutive,
          last_active_date: today,
        });
      }
      return Response.json({
        dropped: false,
        reason: 'no_drop',
        eligible: true,
        consecutive: newConsecutive,
      });
    }

    // Step 7 — Rarity roll
    const selectedRarity = pickRarity(settings);

    // Step 8 — Award the box
    const newBox = await sr.LootBox.create({
      setter_id,
      rarity: selectedRarity,
      status: 'unopened',
      awarded_date: today,
      source: 'booking_drop',
      booking_id: lead_id,
    });

    if (profile) {
      await sr.SetterProfile.update(profile.id, {
        consecutive_bookings_no_drop: 0,
        last_active_date: today,
      });
    }

    // Step 9 — Return result
    const updatedUnopenedBoxes = await sr.LootBox.filter({ setter_id, status: 'unopened' }, '-created_date', 5000);

    return Response.json({
      dropped: true,
      eligible: true,
      rarity: selectedRarity,
      loot_box_id: newBox.id,
      inventory_count: updatedUnopenedBoxes.length,
    });
  } catch (error) {
    console.error('processLootBoxDrop error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});