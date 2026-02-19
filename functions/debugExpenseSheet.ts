import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Expense Sheet';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin' && user?.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:Z10`, { headers });
    const rangeData = await rangeResp.json();
    const rows = rangeData.values || [];

    return Response.json({
      headers: rows[0] || [],
      sampleRows: rows.slice(1, 6),
      totalRows: rows.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});