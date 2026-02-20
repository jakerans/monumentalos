import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Leads';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const COLUMN_MAP = {
  'Client ID': 'client_id',
  'Setter ID': 'setter_id',
  'Booked By Setter ID': 'booked_by_setter_id',
  'Name': 'name',
  'Email': 'email',
  'Phone': 'phone',
  'Lead Source': 'lead_source',
  'Industries': 'industries',
  'Ad Name': 'ad_name',
  'Project Type': 'project_type',
  'Project Size': 'project_size',
  'Notes': 'notes',
  'Status': 'status',
  'DQ Reason': 'dq_reason',
  'First Call Made Date': 'first_call_made_date',
  'Speed to Lead (min)': 'speed_to_lead_minutes',
  'Lead Received Date': 'lead_received_date',
  'Appointment Date': 'appointment_date',
  'Date Appointment Set': 'date_appointment_set',
  'Disposition': 'disposition',
  'Outcome': 'outcome',
  'Sale Amount': 'sale_amount',
  'Date Sold': 'date_sold',
};

const HEADERS = ['App ID', ...Object.keys(COLUMN_MAP)];

const NUMERIC_FIELDS = ['speed_to_lead_minutes', 'sale_amount'];
const ARRAY_FIELDS = ['industries'];
const ENUM_FIELDS = {
  lead_source: ['form', 'msg', 'quiz', 'inbound_call', 'agency'],
  status: ['new', 'first_call_made', 'contacted', 'appointment_booked', 'disqualified', 'completed'],
  dq_reason: ['looking_for_work', 'not_interested', 'wrong_invalid_number', 'project_size', 'oosa', 'client_availability'],
  disposition: ['scheduled', 'showed', 'cancelled', 'rescheduled'],
  outcome: ['pending', 'sold', 'lost'],
};

function parseSheetValue(field, value) {
  if (value === '' || value === undefined || value === null) return undefined;
  if (ARRAY_FIELDS.includes(field)) {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (NUMERIC_FIELDS.includes(field)) {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  if (ENUM_FIELDS[field]) {
    const v = value.trim().toLowerCase();
    return ENUM_FIELDS[field].includes(v) ? v : undefined;
  }
  return value.trim();
}

function toSheetValue(field, value) {
  if (value === null || value === undefined) return '';
  if (ARRAY_FIELDS.includes(field) && Array.isArray(value)) return value.join(', ');
  return String(value);
}

async function fetchAllEntities(base44, entityName) {
  const all = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    const batch = await base44.asServiceRole.entities[entityName].filter({}, '-created_date', limit, skip);
    all.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

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

    // Allow both admin manual trigger and scheduled (service role) calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user && (user.role === 'admin' || user.app_role === 'admin');
    } catch (_) {
      // scheduled automation — no user context, that's fine
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Ensure the "Leads" sheet tab exists
    const metaResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}?fields=sheets.properties.title`, { headers });
    const metaData = await metaResp.json();
    const sheetTitles = (metaData.sheets || []).map(s => s.properties.title);
    if (!sheetTitles.includes(SHEET_NAME)) {
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
        }),
      });
    }

    // 1. Read current sheet data
    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers });
    const rangeData = await rangeResp.json();
    const rows = rangeData.values || [];

    // 2. Get all leads from DB
    const leads = await fetchAllEntities(base44, 'Lead');
    const leadById = {};
    leads.forEach(l => { leadById[l.id] = l; });

    let sheetCreated = 0;
    let sheetUpdated = 0;
    let dbCreated = 0;
    let dbUpdated = 0;

    const lastCol = colLetter(HEADERS.length - 1);

    // If sheet is empty, initialize with headers + all leads
    if (rows.length === 0) {
      const dataRows = leads.map(l =>
        HEADERS.map(h => {
          if (h === 'App ID') return l.id;
          return toSheetValue(COLUMN_MAP[h], l[COLUMN_MAP[h]]);
        })
      );
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [HEADERS, ...dataRows] }),
      });
      return Response.json({ success: true, message: 'Sheet initialized', sheetCreated: leads.length, sheetUpdated: 0, dbCreated: 0, dbUpdated: 0 });
    }

    // Parse headers from first row
    const sheetHeaders = rows[0];
    const appIdCol = sheetHeaders.indexOf('App ID');
    const colIndices = {};
    for (const [header, field] of Object.entries(COLUMN_MAP)) {
      const idx = sheetHeaders.indexOf(header);
      if (idx !== -1) colIndices[field] = idx;
    }

    const seenLeadIds = new Set();
    const sheetUpdates = [];
    const rowsToDelete = []; // sheet row indices for leads that no longer exist in DB

    // 3. Process each sheet row -> sync to DB
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const appId = appIdCol !== -1 ? (row[appIdCol] || '').trim() : '';
      const sheetName = colIndices['name'] !== undefined ? (row[colIndices['name']] || '').trim() : '';

      if (!appId && !sheetName) continue;

      // If the row has an App ID but that lead no longer exists in DB, mark for deletion
      if (appId && !leadById[appId]) {
        rowsToDelete.push(i);
        continue;
      }

      if (appId && leadById[appId]) {
        // Existing lead — two-way merge (sheet wins for non-empty differing values)
        seenLeadIds.add(appId);
        const lead = leadById[appId];
        const dbUpdatesObj = {};
        const rowUpdate = [...row];
        let rowChanged = false;

        for (const [field, colIdx] of Object.entries(colIndices)) {
          const sheetVal = (row[colIdx] || '').trim();
          const dbVal = toSheetValue(field, lead[field]);

          if (sheetVal && sheetVal !== dbVal) {
            const parsed = parseSheetValue(field, sheetVal);
            if (parsed !== undefined) dbUpdatesObj[field] = parsed;
          } else if (!sheetVal && dbVal) {
            rowUpdate[colIdx] = dbVal;
            rowChanged = true;
          }
        }

        if (appIdCol !== -1 && !(row[appIdCol] || '').trim()) {
          rowUpdate[appIdCol] = appId;
          rowChanged = true;
        }

        if (Object.keys(dbUpdatesObj).length > 0) {
          await base44.asServiceRole.entities.Lead.update(appId, dbUpdatesObj);
          dbUpdated++;
        }

        if (rowChanged) {
          while (rowUpdate.length < sheetHeaders.length) rowUpdate.push('');
          sheetUpdates.push({
            range: `${SHEET_NAME}!A${i + 1}:${lastCol}${i + 1}`,
            values: [rowUpdate],
          });
          sheetUpdated++;
        }
      } else if (!appId && sheetName) {
        // New row in sheet without App ID — create in DB
        const newLead = {};
        for (const [field, colIdx] of Object.entries(colIndices)) {
          const parsed = parseSheetValue(field, (row[colIdx] || '').trim());
          if (parsed !== undefined) newLead[field] = parsed;
        }
        if (newLead.name && newLead.client_id) {
          const created = await base44.asServiceRole.entities.Lead.create(newLead);
          dbCreated++;
          const rowUpdate = [...row];
          while (rowUpdate.length < sheetHeaders.length) rowUpdate.push('');
          if (appIdCol !== -1) rowUpdate[appIdCol] = created.id;
          sheetUpdates.push({
            range: `${SHEET_NAME}!A${i + 1}:${lastCol}${i + 1}`,
            values: [rowUpdate],
          });
        }
      }
    }

    // 4. Push DB leads not in sheet -> append new rows
    const newRows = [];
    for (const lead of leads) {
      if (seenLeadIds.has(lead.id)) continue;
      const newRow = HEADERS.map(h => {
        if (h === 'App ID') return lead.id;
        return toSheetValue(COLUMN_MAP[h], lead[COLUMN_MAP[h]]);
      });
      newRows.push(newRow);
      sheetCreated++;
    }

    // 5. Batch update existing rows
    if (sheetUpdates.length > 0) {
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values:batchUpdate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: sheetUpdates }),
      });
    }

    // 6. Append new rows
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
      dbCreated,
      dbUpdated,
      totalLeadsInDB: leads.length,
      totalRowsInSheet: rows.length - 1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});