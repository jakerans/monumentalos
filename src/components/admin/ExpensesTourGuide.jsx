import React from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

export default function ExpensesTourGuide() {
  const startTour = () => {
    const driverObj = createDriver({
      animate: true,
      overlayOpacity: 0.75,
      stagePadding: 10,
      allowClose: true,
      doneBtnText: 'Done',
      closeBtnText: 'Exit Guide',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      steps: [
        {
          popover: {
            title: '💰 Expense Management Guide',
            description: "This walks you through how to sync, categorize, and review your agency expenses. Your external automation (Make) filters the junk — this page is where you review what's left and get everything categorized. Takes about 2 minutes.",
          },
        },
        {
          element: '[data-tour="expense-monthly-close"]',
          popover: {
            title: '🔒 Monthly Close',
            description: "This shows whether you're ready to close the books for the month. It checks two things: are all expenses categorized, and are all clients billed? Once both are green, you can lock the month. Expand it to see the checklist.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-date-range"]',
          popover: {
            title: '📅 Date Range',
            description: "Controls which expenses you see below. Defaults to the current month. Change this to review past months or narrow down to a specific week. Everything on this page — totals, categories, the table — filters based on these dates.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-toolbar"]',
          popover: {
            title: '🔧 Your Main Actions',
            description: "Three things you'll do here: \"Sync from Sheet\" pulls new transactions from your bank feed. \"AI Categorize\" appears when there are uncategorized expenses — it reads descriptions and assigns categories automatically. \"Add Expense\" is for manual one-offs that don't come from the bank.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-sync-btn"]',
          popover: {
            title: '🔄 Step 1 — Sync',
            description: "Start here every time. This pulls cleaned transactions from your Google Sheet into the app. Your Make automation already filtered out payroll, transfers, and deposits — so everything that syncs in is a real business expense waiting to be categorized.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-ai-btn"]',
          popover: {
            title: '✨ Step 2 — AI Categorize',
            description: "This button only appears when you have uncategorized expenses. It sends them to AI which reads the description, checks the bank account, and assigns a category and type. It learns from your past categorizations — the more you manually correct, the smarter it gets.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-summary-cards"]',
          popover: {
            title: '📊 Expense Totals',
            description: "Your spending snapshot for the selected date range. Total Expenses is everything combined. COGS is direct costs of serving clients (ad spend, contractor work). Overhead is what you'd pay even with zero clients (software, office). These feed directly into your P&L.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-category-breakdown"]',
          popover: {
            title: '📋 Category Breakdown',
            description: "See where your money is going at a glance — what percentage is ad spend vs software vs contractor fees. If a category looks too high or something is in the wrong bucket, that's your signal to spot-check individual expenses below.",
            side: 'top',
          },
        },
        {
          element: '[data-tour="expense-duplicate-cleaner"]',
          popover: {
            title: '🧹 Duplicate Cleaner',
            description: "If the same transaction synced twice (happens occasionally), hit Scan for Duplicates. It finds them by matching date + amount + description, then lets you purge the extras in one click. Run this after your first sync of the month.",
            side: 'top',
          },
        },
        {
          element: '[data-tour="expense-filters"]',
          popover: {
            title: '🔍 Filter & Search',
            description: "Narrow the table to a specific category, type, or bank account. The search bar matches on description, vendor, or client name. Use the category filter to quickly find all uncategorized expenses after an AI run.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="expense-table"]',
          popover: {
            title: '📝 Step 3 — Review & Edit',
            description: "Every field is editable — click any category, type, vendor, client, or amount to change it inline. When the AI suggests a category, you'll see a small yellow \"AI\" hint. Click the category badge to pick a different one, or click the green checkmark in the Actions column to approve the AI's suggestion.",
            side: 'top',
          },
        },
        {
          element: '[data-tour="expense-overflow-menu"]',
          popover: {
            title: '⋯ More Options',
            description: "Three things tucked in here: \"Undo AI Categorization\" resets all AI suggestions if something went wrong. \"Show/Hide Distributions\" toggles whether owner draws appear in the table (hidden by default so they don't inflate your expense totals).",
            side: 'left',
          },
        },
        {
          popover: {
            title: "✅ Your Monthly Workflow",
            description: "1. Sync from Sheet to pull new transactions.\n2. AI Categorize to auto-sort them.\n3. Review the table — fix anything the AI got wrong.\n4. Scan for duplicates.\n5. Check Monthly Close — when everything's categorized and billed, lock the month.\n\nThe more you manually correct, the better the AI gets next month.",
          },
        },
      ],
    });
    driverObj.drive();
  };

  return (
    <button
      onClick={startTour}
      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors relative group"
      title="Expense Guide"
    >
      <HelpCircle className="w-4 h-4" />
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
        Expense Guide
      </div>
    </button>
  );
}