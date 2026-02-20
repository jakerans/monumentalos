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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function updateWithRetry(entity, id, data, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await entity.update(id, data);
      return true;
    } catch (err) {
      if (err.message?.includes('Rate limit') && attempt < maxRetries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Server-side filter: fetch only expenses with category = 'uncategorized'
    //    Also fetch those with expense_type = 'uncategorized' in a second query, then merge
    const [byCat, byType] = await Promise.all([
      fetchAllFiltered(base44.entities.Expense, { category: 'uncategorized' }, '-date'),
      fetchAllFiltered(base44.entities.Expense, { expense_type: 'uncategorized' }, '-date'),
    ]);

    // Merge and deduplicate by ID
    const seen = new Set();
    const uncategorized = [];
    for (const e of [...byCat, ...byType]) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        uncategorized.push(e);
      }
    }

    if (uncategorized.length === 0) {
      return Response.json({ message: 'No uncategorized expenses found.', processed: 0, updated: 0, skipped_invalid: 0 });
    }

    // 2. Fetch AI expense settings
    const settingsArr = await base44.entities.CompanySettings.filter({ key: 'ai_expense' });
    const settings = settingsArr.length > 0 ? settingsArr[0] : {};

    const allowedCategories = settings.allowed_expense_categories?.length
      ? settings.allowed_expense_categories
      : ['ad_spend', 'payroll', 'software', 'office', 'contractor', 'travel', 'other'];

    const allowedTypes = settings.allowed_expense_types?.length
      ? settings.allowed_expense_types
      : ['cogs', 'overhead', 'distribution'];

    const customInstructions = settings.ai_custom_instructions || '';

    // 3. Build expense list (cap at 200 for token limits)
    const batch = uncategorized.slice(0, 200);
    const expenseList = batch.map(e => ({
      id: e.id,
      description: e.description || '',
      vendor: e.vendor || '',
      amount: e.amount || 0,
      date: e.date || '',
    }));

    // 4. Single AI invocation
    const systemPrompt = `You are a bookkeeper AI. Your job is to categorize business expenses.

ALLOWED CATEGORIES (you MUST only use these exact values): ${JSON.stringify(allowedCategories)}
ALLOWED EXPENSE TYPES (you MUST only use these exact values): ${JSON.stringify(allowedTypes)}

You are STRICTLY FORBIDDEN from inventing new categories or types. Only use the exact values listed above.

${customInstructions ? `ADDITIONAL ADMIN INSTRUCTIONS:\n${customInstructions}\n` : ''}

For each expense below, determine the best matching category and type based on the description, vendor, and amount.
Also, if the vendor field is empty, try to deduce the vendor/payee name from the description. If you can identify one, include it as "suggested_vendor". If you cannot determine a vendor, omit the field or set it to null.

Expenses to categorize:
${JSON.stringify(expenseList, null, 2)}

Return a JSON object with a "results" array. Each item must have: expense_id, suggested_category, suggested_type. Optionally include suggested_vendor (string) if the vendor was empty and you could deduce one.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                expense_id: { type: 'string' },
                suggested_category: { type: 'string' },
                suggested_type: { type: 'string' },
                suggested_vendor: { type: ['string', 'null'] },
              },
              required: ['expense_id', 'suggested_category', 'suggested_type'],
            },
          },
        },
        required: ['results'],
      },
    });

    const results = aiResponse?.results || [];

    // 5. Validate results
    const categorySet = new Set(allowedCategories);
    const typeSet = new Set(allowedTypes);
    const batchMap = new Map(batch.map(e => [e.id, e]));

    const validResults = results.filter(
      r => r.expense_id && categorySet.has(r.suggested_category) && typeSet.has(r.suggested_type) && batchMap.has(r.expense_id)
    );

    // 6. Update sequentially with retry to avoid rate limits
    let updated = 0;
    for (const r of validResults) {
      const updateData = {
        suggested_category: r.suggested_category,
        suggested_type: r.suggested_type,
        ai_approved: false,
      };
      const original = batchMap.get(r.expense_id);
      if (!original?.vendor && r.suggested_vendor) {
        updateData.vendor = r.suggested_vendor;
      }
      await updateWithRetry(base44.asServiceRole.entities.Expense, r.expense_id, updateData);
      updated++;
      if (updated % 3 === 0) await sleep(300);
    }

    return Response.json({
      message: 'Batch categorization complete',
      total_uncategorized: uncategorized.length,
      batch_size: batch.length,
      updated,
      skipped_invalid: results.length - validResults.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});