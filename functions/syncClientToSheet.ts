import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Company Data';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const COLUMN_MAP = {
  'Company Name': 'name',
  'Industries': 'industries',
  'Ad Account ID': 'ad_account_id',
  'Billing Type': 'billing_type',
  'Price Per Show': 'price_per_shown_appointment',
  'Price Per Set': 'price_per_set_appointment',
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

function toSheetValue(field, value) {
  if (value === null || value === undefined) return '';
  if (field === 'industries' && Array.isArray(value)) return value.join(', ');
  return String(value);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();
    if (!client_id) {
      return Response.json({ error: 'client_id is required' }, { status: 400 });
    }

    const client = await base44.asServiceRole.entities.Client.get(client_id);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Read sheet to find the row
    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers });
    const rangeData = await rangeResp.json();
    const rows = rangeData.values || [];

    if (rows.length === 0) {
      return Response.json({ error: 'Sheet is empty' }, { status: 400 });
    }

    const sheetHeaders = rows[0];
    const appIdCol = sheetHeaders.indexOf('App ID');

    // Find existing row by App ID
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (appIdCol !== -1 && (rows[i][appIdCol] || '').trim() === client_id) {
        rowIndex = i;
        break;
      }
    }

    // Build row values
    const rowValues = HEADERS.map(h => {
      if (h === 'App ID') return client.id;
      const field = COLUMN_MAP[h];
      return toSheetValue(field, client[field]);
    });

    // Pad to match sheet width
    while (rowValues.length < sheetHeaders.length) rowValues.push('');

    if (rowIndex !== -1) {
      // Update existing row
      const range = `${SHEET_NAME}!A${rowIndex + 1}:${String.fromCharCode(64 + sheetHeaders.length)}${rowIndex + 1}`;
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values: [rowValues] }),
      });
    } else {
      // Append new row
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [rowValues] }),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});