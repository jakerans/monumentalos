import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// Map entity names to their sheet tab names
const ENTITY_SHEET_MAP = {
  Client: 'Company Data',
  Lead: 'Leads',
  Expense: 'Expense Sheet',
};

function colLetter(index) {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event } = payload || {};
    if (!event || event.type !== 'delete') {
      return Response.json({ skipped: true, reason: 'Not a delete event' });
    }

    const entityName = event.entity_name;
    const entityId = event.entity_id;
    const sheetName = ENTITY_SHEET_MAP[entityName];

    if (!sheetName) {
      return Response.json({ skipped: true, reason: `No sheet mapping for entity: ${entityName}` });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const gHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Read the sheet
    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`, { headers: gHeaders });
    if (!rangeResp.ok) {
      const errText = await rangeResp.text();
      return Response.json({ error: `Failed to read sheet: ${errText}` }, { status: 500 });
    }
    const rows = (await rangeResp.json()).values || [];
    if (rows.length < 2) {
      return Response.json({ skipped: true, reason: 'Sheet is empty' });
    }

    const sheetHeaders = rows[0];
    const isDeletedCol = sheetHeaders.indexOf('is_deleted');

    if (isDeletedCol === -1) {
      return Response.json({ error: 'is_deleted column not found in sheet headers' }, { status: 400 });
    }

    // For Clients/Leads, App ID is in the header row; for Expenses, App ID is at a fixed column
    let appIdCol;
    if (entityName === 'Expense') {
      // Expense sheet uses column Q (index 16) for App ID
      appIdCol = 16;
    } else {
      appIdCol = sheetHeaders.indexOf('App ID');
    }

    if (appIdCol === -1) {
      return Response.json({ error: 'App ID column not found in sheet' }, { status: 400 });
    }

    // Find the row with this entity ID and mark is_deleted = TRUE
    const isDeletedColLetter = colLetter(isDeletedCol);
    let marked = false;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowAppId = (row[appIdCol] || '').trim();
      if (rowAppId === entityId) {
        // Write TRUE to the is_deleted column for this row
        await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!${isDeletedColLetter}${i + 1}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: gHeaders,
          body: JSON.stringify({ values: [['TRUE']] }),
        });
        marked = true;
        console.log(`[onEntityDeletedMarkSheet] Marked ${entityName} ${entityId} as deleted in sheet "${sheetName}" row ${i + 1}`);
        break;
      }
    }

    return Response.json({ success: true, marked, entityName, entityId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});