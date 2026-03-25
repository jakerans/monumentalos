import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Expense Sheet';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const gHeaders = { 'Authorization': `Bearer ${accessToken}` };

    const resp = await fetch(
      `${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:Z1`,
      { headers: gHeaders }
    );
    const data = await resp.json();
    const headers = (data.values || [[]])[0];

    // Map each header to its column letter
    const mapped = headers.map((h, i) => ({
      index: i,
      col: String.fromCharCode(65 + i),
      header: h,
    }));

    // What the sync function expects at specific indices
    const expected = {
      0:  'A — Row ID (bank feed unique ID)',
      1:  'B — Date',
      2:  'C — Description',
      3:  'D — Amount (negative = expense)',
      4:  'E — Bank Account identifier',
      5:  'F — App ID (written by sync)',
      6:  'G — Category (written by sync)',
      7:  'H — Expense Type (written by sync)',
      8:  'I — Client ID (written by sync)',
      9:  'J — Vendor (written by sync)',
      10: 'K — Synced flag (written by sync)',
    };

    const issues = [];
    for (const [idx, desc] of Object.entries(expected)) {
      const i = parseInt(idx);
      const actual = headers[i] || '(empty)';
      issues.push({ index: i, col: String.fromCharCode(65 + i), expected: desc, actual });
    }

    // Also check for is_deleted column
    const isDeletedIdx = headers.indexOf('is_deleted');

    return Response.json({
      totalColumns: headers.length,
      headers: mapped,
      expectedColumns: issues,
      isDeletedCol: isDeletedIdx !== -1 ? `Column ${String.fromCharCode(65 + isDeletedIdx)} (index ${isDeletedIdx})` : 'NOT FOUND (optional)',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});