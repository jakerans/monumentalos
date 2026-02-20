import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Company Data';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// Column mapping: sheet header -> Client entity field
const COLUMN_MAP = {
  'Company Name': 'name',
  'Industries': 'industries',
  'Ad Account ID': 'ad_account_id',
  'Billing Type': 'billing_type',
  'Price Per Show': 'price_per_shown_appointment',
  'Price Per Set': 'price_per_set_appointment',
  'Industry Pricing': 'industry_pricing',
  'Retainer Amount': 'retainer_amount',
  'Retainer Due Day': 'retainer_due_day',
  'Status': 'status',
  'Start Date': 'start_date',
  'Booking Link': 'booking_link',
  'Service Radius': 'service_radius',
  'Target Zip Codes': 'target_zip_codes',
  'Negative Zip Codes': 'negative_zip_codes',
  'Goal Type': 'goal_type',
  'Goal Value': 'goal_value',
};

const HEADERS = ['App ID', ...Object.keys(COLUMN_MAP)];

// Reverse map: entity field -> header
const FIELD_TO_HEADER = {};
for (const [header, field] of Object.entries(COLUMN_MAP)) {
  FIELD_TO_HEADER[field] = header;
}

function parseSheetValue(field, value) {
  if (value === '' || value === undefined || value === null) return undefined;
  if (field === 'industries') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (field === 'industry_pricing') {
    // Parse format: "painting:show=150,set=100; epoxy:show=200,set=0"
    return value.split(';').map(s => s.trim()).filter(Boolean).map(entry => {
      const [ind, rest] = entry.split(':');
      const pricing = { industry: ind.trim() };
      (rest || '').split(',').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k && v) pricing[`price_per_${k.trim()}`] = parseFloat(v) || 0;
      });
      return pricing;
    });
  }
  if (['price_per_shown_appointment', 'price_per_set_appointment', 'retainer_amount', 'retainer_due_day', 'goal_value'].includes(field)) {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return value;
}

function toSheetValue(field, value) {
  if (value === null || value === undefined) return '';
  if (field === 'industries' && Array.isArray(value)) return value.join(', ');
  if (field === 'industry_pricing' && Array.isArray(value)) {
    return value.map(p => `${p.industry}:show=${p.price_per_show||0},set=${p.price_per_set||0}`).join('; ');
  }
  return String(value);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.app_role !== 'admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. Read current sheet data
    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers });
    const rangeData = await rangeResp.json();
    const rows = rangeData.values || [];

    // 2. Get all clients from DB
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientById = {};
    clients.forEach(c => { clientById[c.id] = c; });

    let sheetCreated = 0;
    let sheetUpdated = 0;
    let dbCreated = 0;
    let dbUpdated = 0;

    // If sheet is empty or has no headers, initialize it
    if (rows.length === 0) {
      // Write headers + all clients
      const headerRow = HEADERS;
      const dataRows = clients.map(c => {
        return HEADERS.map(h => {
          if (h === 'App ID') return c.id;
          const field = COLUMN_MAP[h];
          return toSheetValue(field, c[field]);
        });
      });

      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [headerRow, ...dataRows] }),
      });

      return Response.json({ success: true, message: 'Sheet initialized', sheetCreated: clients.length, sheetUpdated: 0, dbCreated: 0, dbUpdated: 0 });
    }

    // Parse headers from first row and add any missing columns
    let sheetHeaders = [...rows[0]];
    const missingHeaders = HEADERS.filter(h => !sheetHeaders.includes(h));
    if (missingHeaders.length > 0) {
      sheetHeaders = [...sheetHeaders, ...missingHeaders];
      // Write updated header row back to sheet
      const headerRange = `${SHEET_NAME}!A1:${String.fromCharCode(64 + Math.min(sheetHeaders.length, 26))}1`;
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(headerRange)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values: [sheetHeaders] }),
      });
      // Re-read rows so indices are correct
      const reResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers });
      const reData = await reResp.json();
      rows.length = 0;
      (reData.values || []).forEach(r => rows.push(r));
    }

    const appIdCol = sheetHeaders.indexOf('App ID');
    const colIndices = {};
    for (const [header, field] of Object.entries(COLUMN_MAP)) {
      const idx = sheetHeaders.indexOf(header);
      if (idx !== -1) colIndices[field] = idx;
    }

    // Track which DB clients appear in sheet
    const seenClientIds = new Set();
    const sheetUpdates = []; // {range, values}
    const rowsToDelete = []; // sheet row indices (0-based) for rows whose App ID no longer exists in DB

    // 3. Process each sheet row -> sync to DB
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const appId = appIdCol !== -1 ? (row[appIdCol] || '').trim() : '';
      const sheetName = colIndices['name'] !== undefined ? (row[colIndices['name']] || '').trim() : '';

      if (!appId && !sheetName) continue; // skip empty rows

      // If the row has an App ID but that client no longer exists in DB, mark for deletion
      if (appId && !clientById[appId]) {
        rowsToDelete.push(i); // i is 1-based data row, which equals 0-based sheet row index (since headers are row 0)
        continue;
      }

      if (appId && clientById[appId]) {
        // Existing client — two-way merge (sheet wins for non-empty values, push DB values for empty sheet cells)
        seenClientIds.add(appId);
        const client = clientById[appId];
        const dbUpdates = {};
        const rowUpdate = [...row];
        let rowChanged = false;

        for (const [field, colIdx] of Object.entries(colIndices)) {
          const sheetVal = (row[colIdx] || '').trim();
          const dbVal = toSheetValue(field, client[field]);

          if (sheetVal && sheetVal !== dbVal) {
            // Sheet has a value that differs — sheet wins, update DB
            const parsed = parseSheetValue(field, sheetVal);
            if (parsed !== undefined) dbUpdates[field] = parsed;
          } else if (!sheetVal && dbVal) {
            // Sheet is empty but DB has value — push DB to sheet
            rowUpdate[colIdx] = dbVal;
            rowChanged = true;
          }
        }

        // Ensure App ID is in the row
        if (appIdCol !== -1 && !(row[appIdCol] || '').trim()) {
          rowUpdate[appIdCol] = appId;
          rowChanged = true;
        }

        if (Object.keys(dbUpdates).length > 0) {
          await base44.asServiceRole.entities.Client.update(appId, dbUpdates);
          dbUpdated++;
        }

        if (rowChanged) {
          // Pad row to match header length
          while (rowUpdate.length < sheetHeaders.length) rowUpdate.push('');
          sheetUpdates.push({
            range: `${SHEET_NAME}!A${i + 1}:${String.fromCharCode(64 + sheetHeaders.length)}${i + 1}`,
            values: [rowUpdate],
          });
          sheetUpdated++;
        }
      } else if (!appId && sheetName) {
        // New row in sheet without App ID — create in DB
        const newClient = {};
        for (const [field, colIdx] of Object.entries(colIndices)) {
          const parsed = parseSheetValue(field, (row[colIdx] || '').trim());
          if (parsed !== undefined) newClient[field] = parsed;
        }
        if (newClient.name) {
          const created = await base44.asServiceRole.entities.Client.create(newClient);
          dbCreated++;
          // Write back App ID to sheet
          const rowUpdate = [...row];
          while (rowUpdate.length < sheetHeaders.length) rowUpdate.push('');
          if (appIdCol !== -1) rowUpdate[appIdCol] = created.id;
          sheetUpdates.push({
            range: `${SHEET_NAME}!A${i + 1}:${String.fromCharCode(64 + sheetHeaders.length)}${i + 1}`,
            values: [rowUpdate],
          });
        }
      }
    }

    // 4. Push DB clients not in sheet -> append new rows
    const newRows = [];
    for (const client of clients) {
      if (seenClientIds.has(client.id)) continue;
      // Check if already matched by name
      const alreadyInSheet = rows.slice(1).some(r => {
        const nameIdx = colIndices['name'];
        return nameIdx !== undefined && (r[nameIdx] || '').trim().toLowerCase() === (client.name || '').toLowerCase();
      });
      if (alreadyInSheet) continue;

      const newRow = HEADERS.map(h => {
        if (h === 'App ID') return client.id;
        const field = COLUMN_MAP[h];
        return toSheetValue(field, client[field]);
      });
      newRows.push(newRow);
      sheetCreated++;
    }

    // 5. Delete rows for clients that no longer exist in DB
    let sheetDeleted = 0;
    if (rowsToDelete.length > 0) {
      // Get the numeric sheetId for the tab
      const metaResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}?fields=sheets.properties`, { headers });
      const metaData = await metaResp.json();
      const sheetMeta = (metaData.sheets || []).find(s => s.properties.title === SHEET_NAME);
      const sheetId = sheetMeta ? sheetMeta.properties.sheetId : 0;

      // Delete from bottom to top so indices don't shift
      const deleteRequests = rowsToDelete
        .sort((a, b) => b - a)
        .map(rowIdx => ({
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 }
          }
        }));

      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ requests: deleteRequests }),
      });
      sheetDeleted = rowsToDelete.length;
    }

    // 6. Batch update existing rows
    if (sheetUpdates.length > 0) {
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values:batchUpdate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: sheetUpdates,
        }),
      });
    }

    // 7. Append new rows
    if (newRows.length > 0) {
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: newRows }),
      });
    }

    return Response.json({
      success: true,
      sheetCreated,
      sheetUpdated,
      sheetDeleted,
      dbCreated,
      dbUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});