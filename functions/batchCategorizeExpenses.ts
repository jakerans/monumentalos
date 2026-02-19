import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchAll(entity, filter, sort) {
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
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Fetch all uncategorized expenses (ai_approved=false AND no suggested_category)
    const allExpenses = await fetchAll(base44.entities.Expense, {}, '-date');
    const uncategorized = allExpenses.filter(
      e => !e.ai_approved && (!e.suggested_category || e.suggested_category === '')
    );

    if (uncategorized.length === 0) {
      return Response.json({ message: 'No uncategorized expenses to process', processed: 0 });
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

    // 3. Build the expense list for the prompt (cap at 200 to stay within token limits)
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

    // 5. Validate and bulk update
    let updated = 0;
    const categorySet = new Set(allowedCategories);
    const typeSet = new Set(allowedTypes);

    const updatePromises = results
      .filter(r => {
        return r.expense_id && categorySet.has(r.suggested_category) && typeSet.has(r.suggested_type);
      })
      .map(async (r) => {
        await base44.asServiceRole.entities.Expense.update(r.expense_id, {
          suggested_category: r.suggested_category,
          suggested_type: r.suggested_type,
          ai_approved: false,
        });
        updated++;
      });

    await Promise.all(updatePromises);

    return Response.json({
      message: `Batch categorization complete`,
      total_uncategorized: uncategorized.length,
      batch_size: batch.length,
      updated,
      skipped_invalid: results.length - updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});