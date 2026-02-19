import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Expense Sheet';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// Our app columns (already appended to the sheet at cols Q-V, indices 16-21)
// Headers in sheet: ... Bank ID (15) | App ID (16) | Category (17) | Expense Type (18) | Client ID (19) | Vendor (20) | Synced (21)
const APP_ID_COL = 16;
const APP_CATEGORY_COL = 17;
const APP_EXP_TYPE_COL = 18;
const APP_CLIENT_ID_COL = 19;
const APP_VENDOR_COL = 20;
const APP_SYNCED_COL = 21;

// Bank columns
const BANK_DATE_COL = 1;       // "Date"
const BANK_DESC_COL = 3;       // "Description"
const BANK_AMOUNT_COL = 6;     // "Amount" (negative = expense)

const VALID_CATEGORIES = ['ad_spend', 'payroll', 'software', 'office', 'contractor', 'travel', 'distribution', 'processing_fee', 'other'];
const VALID_TYPES = ['cogs', 'overhead', 'distribution'];

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
  const cleaned = String(val).replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function getCell(row, idx) {
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

    // Allow both admin and scheduled calls
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin' && user.app_role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_) {
      // Scheduled automation — no user
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const gHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. Read the full Expense Sheet
    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers: gHeaders });
    if (!rangeResp.ok) {
      const errText = await rangeResp.text();
      return Response.json({ error: `Failed to read sheet: ${errText}` }, { status: 500 });
    }
    const rangeData = await rangeResp.json();
    const rows = rangeData.values || [];

    if (rows.length < 2) {
      return Response.json({ success: true, message: 'Sheet has no data rows', stats: {} });
    }

    // 2. Get all expenses from DB
    const expenses = await fetchAllExpenses(base44);
    const expenseById = {};
    expenses.forEach(e => { expenseById[e.id] = e; });

    let imported = 0;
    let updatedFromSheet = 0;
    let updatedToSheet = 0;
    let skippedPositive = 0;
    const sheetUpdates = [];

    // 3. Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const rawAmount = getCell(row, BANK_AMOUNT_COL);
      const amount = parseAmount(rawAmount);

      // Skip positive amounts (deposits/credits) and empty amounts
      if (amount === null || amount >= 0) {
        skippedPositive++;
        continue;
      }

      const rawDate = getCell(row, BANK_DATE_COL);
      const rawDesc = getCell(row, BANK_DESC_COL);
      const date = parseDate(rawDate);
      if (!date) continue; // can't import without a date

      const expenseAmount = Math.abs(amount);
      const appId = getCell(row, APP_ID_COL);
      const sheetCategory = getCell(row, APP_CATEGORY_COL).toLowerCase();
      const sheetExpType = getCell(row, APP_EXP_TYPE_COL).toLowerCase();
      const sheetClientId = getCell(row, APP_CLIENT_ID_COL);
      const sheetVendor = getCell(row, APP_VENDOR_COL);

      if (appId && expenseById[appId]) {
        // ── Already synced — 2-way merge ──
        const existing = expenseById[appId];
        const dbUpdates = {};

        // Sheet → DB (sheet wins for non-empty values that differ)
        if (sheetCategory && VALID_CATEGORIES.includes(sheetCategory) && sheetCategory !== existing.category) {
          dbUpdates.category = sheetCategory;
        }
        if (sheetExpType && VALID_TYPES.includes(sheetExpType) && sheetExpType !== existing.expense_type) {
          dbUpdates.expense_type = sheetExpType;
        }
        if (sheetClientId && sheetClientId !== (existing.client_id || '')) {
          dbUpdates.client_id = sheetClientId;
        }
        if (sheetVendor && sheetVendor !== (existing.vendor || '')) {
          dbUpdates.vendor = sheetVendor;
        }

        if (Object.keys(dbUpdates).length > 0) {
          await base44.asServiceRole.entities.Expense.update(appId, dbUpdates);
          updatedFromSheet++;
        }

        // DB → Sheet (fill empty sheet cells from DB)
        const appCells = [
          appId,
          existing.category || '',
          existing.expense_type || '',
          existing.client_id || '',
          existing.vendor || '',
          'Yes',
        ];

        // Only update if something changed
        const currentAppCells = [
          getCell(row, APP_ID_COL),
          getCell(row, APP_CATEGORY_COL),
          getCell(row, APP_EXP_TYPE_COL),
          getCell(row, APP_CLIENT_ID_COL),
          getCell(row, APP_VENDOR_COL),
          getCell(row, APP_SYNCED_COL),
        ];

        // Fill empty cells from DB
        let changed = false;
        for (let c = 0; c < appCells.length; c++) {
          if (!currentAppCells[c] && appCells[c]) {
            changed = true;
          } else if (currentAppCells[c]) {
            appCells[c] = currentAppCells[c]; // keep sheet value
          }
        }

        if (changed) {
          sheetUpdates.push({
            range: `${SHEET_NAME}!${colLetter(APP_ID_COL)}${i + 1}:${colLetter(APP_SYNCED_COL)}${i + 1}`,
            values: [appCells],
          });
          updatedToSheet++;
        }
      } else if (!appId) {
        // ── New bank transaction — import to DB ──
        const newExpense = {
          category: (sheetCategory && VALID_CATEGORIES.includes(sheetCategory)) ? sheetCategory : 'other',
          expense_type: (sheetExpType && VALID_TYPES.includes(sheetExpType)) ? sheetExpType : 'overhead',
          description: rawDesc || 'Bank transaction',
          amount: expenseAmount,
          date: date,
          vendor: sheetVendor || '',
        };
        if (sheetClientId) newExpense.client_id = sheetClientId;

        const created = await base44.asServiceRole.entities.Expense.create(newExpense);
        imported++;

        // Write our app columns back to sheet
        sheetUpdates.push({
          range: `${SHEET_NAME}!${colLetter(APP_ID_COL)}${i + 1}:${colLetter(APP_SYNCED_COL)}${i + 1}`,
          values: [[
            created.id,
            newExpense.category,
            newExpense.expense_type,
            newExpense.client_id || '',
            newExpense.vendor,
            'Yes',
          ]],
        });
      }
    }

    // 4. Batch update sheet (groups of 100)
    if (sheetUpdates.length > 0) {
      for (let b = 0; b < sheetUpdates.length; b += 100) {
        const batch = sheetUpdates.slice(b, b + 100);
        await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values:batchUpdate`, {
          method: 'POST',
          headers: gHeaders,
          body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: batch }),
        });
      }
    }

    return Response.json({
      success: true,
      stats: {
        imported,
        updatedFromSheet,
        updatedToSheet,
        skippedPositive,
        totalSheetRows: rows.length - 1,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});