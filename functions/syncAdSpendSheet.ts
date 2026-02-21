import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Ad Spend';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// Column indices (A=0, B=1, ...)
const COL_CLIENT = 0;   // A: Client -> client_id
const COL_DATE   = 1;   // B: Date   -> date
const COL_SPEND  = 2;   // C: Spend  -> amount
const COL_NAME   = 3;   // D: Name   -> campaign_name
const COL_MSG    = 4;   // E: Messages -> messages
const COL_DEL    = 5;   // F: Is_Deleted

function cell(row, idx) {
  return idx < row.length ? (row[idx] || '').trim() : '';
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(String(val).trim());
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseFloat2(val) {
  if (!val && val !== 0) return null;
  const num = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isNaN(num) ? null : num;
}

function parseMessages(val) {
  if (!val) return 0;
  const num = parseInt(String(val).replace(/[,\s]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

async function fetchAllSpend(base44) {
  const all = [];
  let skip = 0;
  const limit = 500;
  while (true) {
    const batch = await base44.asServiceRole.entities.Spend.filter({}, '-date', limit, skip);
    all.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      const user = await base44.auth.me();
      if (user && user.app_role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_) { /* scheduled automation — allow */ }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const gHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. Fetch sheet + existing DB records in parallel
    const [sheetResp, existingSpend] = await Promise.all([
      fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers: gHeaders }),
      fetchAllSpend(base44),
    ]);

    if (!sheetResp.ok) {
      const errText = await sheetResp.text();
      return Response.json({ error: `Failed to read sheet: ${errText}` }, { status: 500 });
    }

    const rows = (await sheetResp.json()).values || [];
    if (rows.length < 2) {
      return Response.json({ added: 0, skipped: 0, total_rows: 0 });
    }

    // 2. Build fingerprint Set from existing DB records
    const existingFingerprints = new Set();
    for (const s of existingSpend) {
      const fp = `${s.client_id}|${s.date}|${s.amount}|${s.campaign_name || ''}`;
      existingFingerprints.add(fp);
    }

    // 3. Process sheet rows (skip header row 0)
    const toInsert = [];
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip deleted rows
      if (cell(row, COL_DEL).toUpperCase() === 'TRUE') { skipped++; continue; }

      const clientId = cell(row, COL_CLIENT);
      const rawDate  = cell(row, COL_DATE);
      const rawSpend = cell(row, COL_SPEND);
      const name     = cell(row, COL_NAME);

      // Skip if required fields are missing
      if (!clientId || !rawDate) { skipped++; continue; }

      const date   = parseDate(rawDate);
      const amount = parseFloat2(rawSpend);

      if (!date || amount === null || amount === 0) { skipped++; continue; }

      const campaignName = name || '';
      const messages     = parseMessages(cell(row, COL_MSG));

      const fp = `${clientId}|${date}|${amount}|${campaignName}`;
      if (existingFingerprints.has(fp)) { skipped++; continue; }

      // Mark as seen to avoid duplicates within same sheet
      existingFingerprints.add(fp);

      toInsert.push({
        client_id: clientId,
        date,
        amount,
        campaign_name: campaignName,
        messages,
      });
    }

    // 4. Bulk create in batches of 50
    let added = 0;
    for (let b = 0; b < toInsert.length; b += 50) {
      const batch = toInsert.slice(b, b + 50);
      const created = await base44.asServiceRole.entities.Spend.bulkCreate(batch);
      added += created.length;
    }

    console.log(`[syncAdSpendSheet] added=${added} skipped=${skipped} total_rows=${rows.length - 1}`);

    return Response.json({
      added,
      skipped,
      total_rows: rows.length - 1,
    });
  } catch (error) {
    console.error('[syncAdSpendSheet] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});