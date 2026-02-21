import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Expense Sheet';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// App columns (Q-W, indices 16-22)
const APP_ID_COL = 16;
const APP_CATEGORY_COL = 17;
const APP_EXP_TYPE_COL = 18;
const APP_CLIENT_ID_COL = 19;
const APP_VENDOR_COL = 20;
const APP_SYNCED_COL = 21;

// Bank columns
const BANK_ID_COL = 0;        // Column A — unique row identifier
const BANK_DATE_COL = 1;
const BANK_DESC_COL = 3;
const BANK_AMOUNT_COL = 6;
const BANK_ACCOUNT_COL = 2;   // Column C — account identifier from bank feed

const VALID_CATEGORIES = ['ad_spend', 'payroll', 'software', 'office', 'contractor', 'travel', 'distribution', 'processing_fee', 'other', 'uncategorized'];
const SKIP_CATEGORIES = ['transaction', 'transfer'];
const SKIP_DESCRIPTIONS = ['GUSTO - TAX', 'GUSTO - NET', 'GUSTO - CND', 'Wise Inc'];
const VALID_TYPES = ['cogs', 'overhead', 'distribution', 'uncategorized'];

function colLetter(index) {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function parseAmount(val) {
  if (!val && val !== 0) return null;
  const num = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(String(val).trim());
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function cell(row, idx) {
  return idx < row.length ? (row[idx] || '').trim() : '';
}

async function fetchAllExpenses(base44) {
  const all = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    const batch = await base44.asServiceRole.entities.Expense.filter({}, '-created_date', limit, skip);
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
      if (user && user.role !== 'admin' && user.app_role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_) { /* scheduled automation */ }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const gHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. Read sheet + DB + bank accounts in parallel
    const [sheetResp, dbExpenses, bankAccounts] = await Promise.all([
      fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers: gHeaders }),
      fetchAllExpenses(base44),
      base44.asServiceRole.entities.BankAccount.list(),
    ]);

    // Build bank account lookup: account_id string → BankAccount.id
    const bankAccountByAccountId = {};
    for (const acct of bankAccounts) {
      if (acct.account_id) bankAccountByAccountId[acct.account_id.trim().toLowerCase()] = acct.id;
    }

    if (!sheetResp.ok) {
      const errText = await sheetResp.text();
      return Response.json({ error: `Failed to read sheet: ${errText}` }, { status: 500 });
    }
    const rows = (await sheetResp.json()).values || [];
    if (rows.length < 2) {
      return Response.json({ success: true, added: 0, skipped: 0, updated: 0, totalProcessed: 0 });
    }

    // Detect is_deleted column from headers
    const sheetHeaders = rows[0];
    const isDeletedCol = sheetHeaders.indexOf('is_deleted');

    // 2. Build O(1) lookup Sets from DB
    const existingSheetIds = new Set();
    const existingFingerprints = new Set();
    const expenseById = {};

    for (const e of dbExpenses) {
      expenseById[e.id] = e;
      if (e.sheet_row_id) existingSheetIds.add(e.sheet_row_id);
      existingFingerprints.add(`${e.date}|${e.amount}|${e.description || ''}`);
    }

    // 3. Single pass over sheet rows — classify each row
    const newRows = [];
    const updateRows = [];
    let skipped = 0;
    const seenSheetIds = new Set();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip rows marked as deleted
      if (isDeletedCol !== -1 && (row[isDeletedCol] || '').trim().toUpperCase() === 'TRUE') { skipped++; continue; }

      const amount = parseAmount(cell(row, BANK_AMOUNT_COL));
      if (amount === null || amount >= 0) { skipped++; continue; }

      const date = parseDate(cell(row, BANK_DATE_COL));
      if (!date) { skipped++; continue; }

      const sheetRowId = cell(row, BANK_ID_COL);
      const rawDesc = cell(row, BANK_DESC_COL);
      const expenseAmount = Math.abs(amount);
      const sheetCategory = cell(row, APP_CATEGORY_COL).toLowerCase();

      if (SKIP_CATEGORIES.some(kw => sheetCategory.includes(kw))) { skipped++; continue; }
      if (SKIP_DESCRIPTIONS.some(kw => rawDesc.toUpperCase().includes(kw.toUpperCase()))) { skipped++; continue; }

      const appId = cell(row, APP_ID_COL);
      const matchedBySheetId = sheetRowId && existingSheetIds.has(sheetRowId);
      const existingRecord = appId ? expenseById[appId] : (matchedBySheetId ? dbExpenses.find(e => e.sheet_row_id === sheetRowId) : null);

      if (existingRecord) {
        updateRows.push({ existing: existingRecord, row, rowIndex: i, sheetRowId });
        continue;
      }

      if (sheetRowId) {
        if (seenSheetIds.has(sheetRowId)) { skipped++; continue; }
        seenSheetIds.add(sheetRowId);
      }
      const fingerprint = `${date}|${expenseAmount}|${rawDesc || ''}`;
      if (existingFingerprints.has(fingerprint)) { skipped++; continue; }
      existingFingerprints.add(fingerprint);

      const sheetExpType = cell(row, APP_EXP_TYPE_COL).toLowerCase();
      const sheetClientId = cell(row, APP_CLIENT_ID_COL);
      const sheetVendor = cell(row, APP_VENDOR_COL);

      const isDistribution = sheetCategory === 'distribution' || rawDesc.toLowerCase().includes('distro');
      const resolvedCategory = isDistribution ? 'distribution' : ((sheetCategory && VALID_CATEGORIES.includes(sheetCategory)) ? sheetCategory : 'uncategorized');
      const resolvedExpType = isDistribution ? 'distribution' : ((sheetExpType && VALID_TYPES.includes(sheetExpType)) ? sheetExpType : 'uncategorized');

      const rawAccountId = cell(row, BANK_ACCOUNT_COL);
      const resolvedBankAccountId = rawAccountId ? bankAccountByAccountId[rawAccountId.trim().toLowerCase()] : null;

      const newExpense = {
        category: resolvedCategory,
        expense_type: resolvedExpType,
        description: rawDesc || 'Bank transaction',
        amount: expenseAmount,
        date,
        vendor: sheetVendor || '',
      };
      if (sheetRowId) newExpense.sheet_row_id = sheetRowId;
      if (sheetClientId) newExpense.client_id = sheetClientId;
      if (resolvedBankAccountId) newExpense.bank_account_id = resolvedBankAccountId;

      newRows.push({ rowIndex: i, data: newExpense });
    }

    // 4. Bulk create new expenses (batches of 50)
    console.log(`[syncExpenses] ${newRows.length} new · ${skipped} skipped · ${updateRows.length} existing to merge`);

    let added = 0;
    const sheetUpdates = [];

    for (let b = 0; b < newRows.length; b += 50) {
      const batch = newRows.slice(b, b + 50);
      const created = await base44.asServiceRole.entities.Expense.bulkCreate(batch.map(r => r.data));
      added += created.length;

      for (let j = 0; j < created.length; j++) {
        const rec = created[j];
        const exp = batch[j].data;
        sheetUpdates.push({
          range: `${SHEET_NAME}!${colLetter(APP_ID_COL)}${batch[j].rowIndex + 1}:${colLetter(APP_SYNCED_COL)}${batch[j].rowIndex + 1}`,
          values: [[rec.id, exp.category, exp.expense_type, exp.client_id || '', exp.vendor, 'Yes']],
        });
      }
    }

    // 5. 2-way merge for existing rows
    let updated = 0;
    for (const { existing, row, rowIndex, sheetRowId } of updateRows) {
      const sheetCategory = cell(row, APP_CATEGORY_COL).toLowerCase();
      const sheetExpType = cell(row, APP_EXP_TYPE_COL).toLowerCase();
      const sheetClientId = cell(row, APP_CLIENT_ID_COL);
      const sheetVendor = cell(row, APP_VENDOR_COL);

      const rawDesc = cell(row, BANK_DESC_COL);
      const isDistroExisting = sheetCategory === 'distribution' || rawDesc.toLowerCase().includes('distro');

      const dbUpdates = {};
      if (sheetRowId && !existing.sheet_row_id) dbUpdates.sheet_row_id = sheetRowId;
      if (isDistroExisting) {
        if (existing.category !== 'distribution') dbUpdates.category = 'distribution';
        if (existing.expense_type !== 'distribution') dbUpdates.expense_type = 'distribution';
      } else {
        if (sheetCategory && VALID_CATEGORIES.includes(sheetCategory) && sheetCategory !== existing.category) dbUpdates.category = sheetCategory;
        if (sheetExpType && VALID_TYPES.includes(sheetExpType) && sheetExpType !== existing.expense_type) dbUpdates.expense_type = sheetExpType;
      }
      if (sheetClientId && sheetClientId !== (existing.client_id || '')) dbUpdates.client_id = sheetClientId;
      if (sheetVendor && sheetVendor !== (existing.vendor || '')) dbUpdates.vendor = sheetVendor;

      if (Object.keys(dbUpdates).length > 0) {
        await base44.asServiceRole.entities.Expense.update(existing.id, dbUpdates);
        updated++;
      }

      const desired = [existing.id, existing.category || '', existing.expense_type || '', existing.client_id || '', existing.vendor || '', 'Yes'];
      const current = [cell(row, APP_ID_COL), cell(row, APP_CATEGORY_COL), cell(row, APP_EXP_TYPE_COL), cell(row, APP_CLIENT_ID_COL), cell(row, APP_VENDOR_COL), cell(row, APP_SYNCED_COL)];
      let changed = false;
      for (let c = 0; c < desired.length; c++) {
        if (!current[c] && desired[c]) { changed = true; }
        else if (current[c]) { desired[c] = current[c]; }
      }
      if (changed) {
        sheetUpdates.push({
          range: `${SHEET_NAME}!${colLetter(APP_ID_COL)}${rowIndex + 1}:${colLetter(APP_SYNCED_COL)}${rowIndex + 1}`,
          values: [desired],
        });
      }
    }

    // 6. Batch write sheet updates (groups of 100)
    for (let b = 0; b < sheetUpdates.length; b += 100) {
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values:batchUpdate`, {
        method: 'POST',
        headers: gHeaders,
        body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: sheetUpdates.slice(b, b + 100) }),
      });
    }

    return Response.json({
      success: true,
      added,
      skipped,
      updated,
      totalProcessed: rows.length - 1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});