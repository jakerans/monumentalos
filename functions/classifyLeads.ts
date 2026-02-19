import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load settings
    const settingsList = await base44.asServiceRole.entities.CompanySettings.filter({ key: 'lead_options' });
    const settings = settingsList[0];
    if (!settings) {
      return Response.json({ success: true, message: 'No lead_options settings found, skipping.' });
    }

    const projectSizes = settings.project_sizes || [];
    const projectTypesByIndustry = settings.project_types_by_industry || {};
    const customInstructions = settings.ai_lead_classify_instructions || '';

    // Get all project type options flattened for leads with no industry
    const allProjectTypes = [...new Set(Object.values(projectTypesByIndustry).flat())];

    // Fetch leads missing project_type or project_size
    const allLeads = [];
    let skip = 0;
    const limit = 200;
    while (true) {
      const batch = await base44.asServiceRole.entities.Lead.filter({}, '-created_date', limit, skip);
      allLeads.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
    }

    const leadsToClassify = allLeads.filter(l => !l.project_type || !l.project_size);

    if (leadsToClassify.length === 0) {
      return Response.json({ success: true, message: 'No leads need classification.', classified: 0 });
    }

    // Process in batches of 20
    const BATCH_SIZE = 20;
    let totalClassified = 0;

    for (let i = 0; i < leadsToClassify.length; i += BATCH_SIZE) {
      const batch = leadsToClassify.slice(i, i + BATCH_SIZE);

      const leadsForPrompt = batch.map((l, idx) => {
        const industries = (l.industries || []).join(', ') || 'none';
        const typeOptions = l.industries?.length
          ? [...new Set(l.industries.flatMap(ind => projectTypesByIndustry[ind] || []))]
          : allProjectTypes;

        return `Lead #${idx + 1}:
- Name: ${l.name || 'N/A'}
- Industries: ${industries}
- Lead Source: ${l.lead_source || 'N/A'}
- Ad Name: ${l.ad_name || 'N/A'}
- Notes: ${l.notes || 'N/A'}
- Current Project Type: ${l.project_type || 'BLANK'}
- Current Project Size: ${l.project_size || 'BLANK'}
- Available Project Types: ${typeOptions.length ? typeOptions.join(', ') : 'none'}
- Available Project Sizes: ${projectSizes.join(', ')}`;
      });

      const prompt = `You are an AI assistant that classifies leads for a home services lead generation company.

For each lead below, determine the best matching project_type and project_size from ONLY the available options listed. 

CRITICAL RULES:
- ONLY use values from the "Available Project Types" and "Available Project Sizes" lists for each lead
- NEVER invent new values
- If you cannot confidently determine a value, use null
- Only fill in fields that are currently BLANK
- If a field already has a value, keep it as-is (use that same value)

${customInstructions ? `ADDITIONAL INSTRUCTIONS FROM ADMIN:\n${customInstructions}\n` : ''}

${leadsForPrompt.join('\n\n')}

Return a JSON object with a "results" array, one entry per lead in order, each with:
{ "project_type": string|null, "project_size": string|null }`;

      const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  project_type: { type: ['string', 'null'] },
                  project_size: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
      });

      const results = response?.results || [];

      for (let j = 0; j < batch.length; j++) {
        const lead = batch[j];
        const result = results[j];
        if (!result) continue;

        const updates = {};
        const industries = lead.industries || [];
        const typeOptions = industries.length
          ? [...new Set(industries.flatMap(ind => projectTypesByIndustry[ind] || []))]
          : allProjectTypes;

        if (!lead.project_type && result.project_type && typeOptions.includes(result.project_type)) {
          updates.project_type = result.project_type;
        }
        if (!lead.project_size && result.project_size && projectSizes.includes(result.project_size)) {
          updates.project_size = result.project_size;
        }

        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Lead.update(lead.id, updates);
          totalClassified++;
        }
      }
    }

    return Response.json({ success: true, classified: totalClassified, total_scanned: leadsToClassify.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});