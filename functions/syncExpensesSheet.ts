import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_ID = '1qn4-rYBgi5ruOm7tB6obbA3yBvSyOU313yNI3b41STM';
const SHEET_NAME = 'Expense Sheet';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// Bank columns we READ from (populated by the bank daily)
const BANK_DATE_COL = 'Date';          // we'll detect these by header name
const BANK_DESC_COL = 'Description';
const BANK_AMOUNT_COL = 'Amount';

// Our app columns we ADD/MANAGE (appended to the right of bank data)
const APP_COLUMNS = ['App ID', 'Category', 'Expense Type', 'Client ID', 'Vendor', 'Synced'];

const CATEGORY_MAP = {
  ad_spend: 'ad_spend', payroll: 'payroll', software: 'software',
  office: 'office', contractor: 'contractor', travel: 'travel',
  distribution: 'distribution', processing_fee: 'processing_fee', other: 'other',
};
const TYPE_MAP = { cogs: 'cogs', overhead: 'overhead', distribution: 'distribution' };

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
  // Try common date formats
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
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

    // Allow both admin manual trigger and scheduled calls
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin' && user.app_role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_) {
      // Scheduled automation — no user context
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. Read the Expense Sheet
    const rangeResp = await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`, { headers });
    if (!rangeResp.ok) {
      const errText = await rangeResp.text();
      return Response.json({ error: `Failed to read sheet: ${errText}` }, { status: 500 });
    }
    const rangeData = await rangeResp.json();
    const rows = rangeData.values || [];

    if (rows.length < 2) {
      return Response.json({ success: true, message: 'Sheet has no data rows', stats: {} });
    }

    // 2. Parse headers — find bank columns and our app columns
    const sheetHeaders = rows[0];
    const bankDateIdx = sheetHeaders.findIndex(h => h.toLowerCase().includes('date'));
    const bankDescIdx = sheetHeaders.findIndex(h => h.toLowerCase().includes('description'));
    const bankAmountIdx = sheetHeaders.findIndex(h => h.toLowerCase().includes('amount'));

    if (bankDateIdx === -1 || bankAmountIdx === -1) {
      return Response.json({ error: 'Could not find Date or Amount columns in sheet headers' }, { status: 400 });
    }

    // Check if our app columns exist, if not add them
    let appIdIdx = sheetHeaders.indexOf('App ID');
    let categoryIdx = sheetHeaders.indexOf('Category');
    let expTypeIdx = sheetHeaders.indexOf('Expense Type');
    let clientIdIdx = sheetHeaders.indexOf('Client ID');
    let vendorIdx = sheetHeaders.indexOf('Vendor');
    let syncedIdx = sheetHeaders.indexOf('Synced');

    const needsAppColumns = appIdIdx === -1;

    if (needsAppColumns) {
      // Append our columns to the header row
      const startCol = sheetHeaders.length;
      appIdIdx = startCol;
      categoryIdx = startCol + 1;
      expTypeIdx = startCol + 2;
      clientIdIdx = startCol + 3;
      vendorIdx = startCol + 4;
      syncedIdx = startCol + 5;

      const headerRange = `${SHEET_NAME}!${colLetter(startCol)}1:${colLetter(startCol + APP_COLUMNS.length - 1)}1`;
      await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values/${encodeURIComponent(headerRange)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values: [APP_COLUMNS] }),
      });
    }

    // 3. Get all expenses from DB
    const expenses = await fetchAllExpenses(base44);
    const expenseById = {};
    expenses.forEach(e => { expenseById[e.id] = e; });

    // Build a lookup of existing synced sheet rows by App ID
    const sheetAppIds = new Set();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const aid = appIdIdx < row.length ? (row[appIdIdx] || '').trim() : '';
      if (aid) sheetAppIds.add(aid);
    }

    let imported = 0;
    let updatedFromSheet = 0;
    let updatedToSheet = 0;
    let skippedPositive = 0;
    const sheetUpdates = [];

    // 4. Process each sheet row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rawDate = bankDateIdx < row.length ? row[bankDateIdx] : '';
      const rawDesc = bankDescIdx !== -1 && bankDescIdx < row.length ? row[bankDescIdx] : '';
      const rawAmount = bankAmountIdx < row.length ? row[bankAmountIdx] : '';
      const appId = appIdIdx < row.length ? (row[appIdIdx] || '').trim() : '';
      const sheetCategory = categoryIdx < row.length ? (row[categoryIdx] || '').trim().toLowerCase() : '';
      const sheetExpType = expTypeIdx < row.length ? (row[expTypeIdx] || '').trim().toLowerCase() : '';
      const sheetClientId = clientIdIdx < row.length ? (row[clientIdIdx] || '').trim() : '';
      const sheetVendor = vendorIdx < row.length ? (row[vendorIdx] || '').trim() : '';

      const amount = parseAmount(rawAmount);
      const date = parseDate(rawDate);

      // Skip positive amounts (deposits) and rows with no amount
      if (amount === null || amount >= 0) {
        skippedPositive++;
        continue;
      }

      const expenseAmount = Math.abs(amount); // Store as positive in our DB

      if (appId && expenseById[appId]) {
        // Already synced — check if sheet has updates to push to DB
        const existing = expenseById[appId];
        const dbUpdates = {};

        if (sheetCategory && CATEGORY_MAP[sheetCategory] && sheetCategory !== existing.category) {
          dbUpdates.category = sheetCategory;
        }
        if (sheetExpType && TYPE_MAP[sheetExpType] && sheetExpType !== existing.expense_type) {
          dbUpdates.expense_type = sheetExpType;
        }
        if (sheetClientId && sheetClientId !== existing.client_id) {
          dbUpdates.client_id = sheetClientId;
        }
        if (sheetVendor && sheetVendor !== existing.vendor) {
          dbUpdates.vendor = sheetVendor;
        }

        if (Object.keys(dbUpdates).length > 0) {
          await base44.asServiceRole.entities.Expense.update(appId, dbUpdates);
          updatedFromSheet++;
        }

        // Push DB values back to empty sheet cells
        const rowUpdate = [...row];
        while (rowUpdate.length <= syncedIdx) rowUpdate.push('');
        let rowChanged = false;

        if (!sheetCategory && existing.category) {
          rowUpdate[categoryIdx] = existing.category;
          rowChanged = true;
        }
        if (!sheetExpType && existing.expense_type) {
          rowUpdate[expTypeIdx] = existing.expense_type;
          rowChanged = true;
        }
        if (!sheetClientId && existing.client_id) {
          rowUpdate[clientIdIdx] = existing.client_id;
          rowChanged = true;
        }
        if (!sheetVendor && existing.vendor) {
          rowUpdate[vendorIdx] = existing.vendor;
          rowChanged = true;
        }

        if (rowChanged) {
          sheetUpdates.push({
            range: `${SHEET_NAME}!${colLetter(appIdIdx)}${i + 1}:${colLetter(syncedIdx)}${i + 1}`,
            values: [rowUpdate.slice(appIdIdx, syncedIdx + 1)],
          });
          updatedToSheet++;
        }
      } else if (!appId && date) {
        // New bank transaction — import to DB
        const newExpense = {
          category: sheetCategory && CATEGORY_MAP[sheetCategory] ? sheetCategory : 'other',
          expense_type: sheetExpType && TYPE_MAP[sheetExpType] ? sheetExpType : 'overhead',
          description: rawDesc.trim() || 'Bank transaction',
          amount: expenseAmount,
          date: date,
          vendor: sheetVendor || '',
        };
        if (sheetClientId) newExpense.client_id = sheetClientId;

        const created = await base44.asServiceRole.entities.Expense.create(newExpense);
        imported++;

        // Write App ID and Synced flag back to sheet
        const appCells = [];
        for (let c = appIdIdx; c <= syncedIdx; c++) appCells.push('');
        appCells[0] = created.id;                       // App ID
        appCells[categoryIdx - appIdIdx] = newExpense.category;
        appCells[expTypeIdx - appIdIdx] = newExpense.expense_type;
        appCells[syncedIdx - appIdIdx] = 'Yes';

        sheetUpdates.push({
          range: `${SHEET_NAME}!${colLetter(appIdIdx)}${i + 1}:${colLetter(syncedIdx)}${i + 1}`,
          values: [appCells],
        });
      }
    }

    // 5. Batch update sheet
    if (sheetUpdates.length > 0) {
      // Batch in groups of 100 to avoid API limits
      for (let b = 0; b < sheetUpdates.length; b += 100) {
        const batch = sheetUpdates.slice(b, b + 100);
        await fetch(`${SHEETS_API}/${SPREADSHEET_ID}/values:batchUpdate`, {
          method: 'POST',
          headers,
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