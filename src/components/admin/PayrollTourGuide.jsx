import React from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function PayrollTourGuide({ onStart, setRunPayrollModalOpen }) {
  const startTour = () => {
    if (onStart) onStart();

    const driver = new Driver({
      animate: true,
      opacity: 0.75,
      padding: 10,
      allowClose: true,
      overlayClickNext: false,
      doneBtnText: 'Done',
      closeBtnText: 'Exit Guide',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      onReset: () => {
        setRunPayrollModalOpen(false);
      },
    });

    const steps = [
      {
        popover: {
          title: '💰 Payroll Guide',
          description: "This guide will walk you through running payroll. About 10 minutes on the first check of the month, 3 minutes on the second. Nothing happens until the very last step — let's go.",
          position: 'mid-center',
        },
      },
      {
        element: '[data-tour="setter-bonuses-section"]',
        popover: {
          title: '🎁 Step 1 — Review Setter Bonuses',
          description: 'Start here. This shows every setter who has pending loot prizes or completed spiffs from last month. Review the amounts before doing anything.',
          position: 'top',
        },
      },
      {
        element: '[data-tour="approve-for-payroll-btn"]',
        popover: {
          title: 'Approve Loot Prizes',
          description: "For each setter with loot prizes, click Approve for Payroll. This queues them — no expense is created yet, nothing is charged. Spiff totals load automatically and don't need approval.",
          position: 'top',
        },
      },
      {
        element: '[data-tour="run-payroll-btn"]',
        popover: {
          title: '▶ Open Run Payroll',
          description: "Once bonuses are approved, click Run Payroll. We'll walk through the modal together — nothing happens until the very last step.",
          position: 'top',
        },
        onNext: () => {
          setRunPayrollModalOpen(true);
          return new Promise(resolve => setTimeout(resolve, 600));
        },
      },
      {
        element: '[data-tour="payroll-date-input"]',
        popover: {
          title: '📅 Payroll Date',
          description: "Set this to your actual pay date. This is the date the expenses will be recorded against in your P&L — not today's date unless you're paying today.",
          position: 'bottom',
        },
      },
      {
        element: '[data-tour="check-number-toggle"]',
        popover: {
          title: '⚠️ Most Important Step',
          description: 'First check of the month loads all prior month bonuses — MM performance pay, setter spiffs, and loot prizes. Second check is base pay only. Wrong selection means missed bonuses or paying them twice.',
          position: 'bottom',
        },
      },
      {
        element: '[data-tour="generate-preview-btn"]',
        popover: {
          title: '👁 Generate Preview',
          description: 'Click Generate Preview when ready. The app pulls everything together — base pay, MM bonus, setter spiffs, and loot prizes. Nothing is saved yet.',
          position: 'top',
        },
      },
      {
        element: '[data-tour="gusto-summary-box"]',
        popover: {
          title: '📋 Gusto Entry Summary',
          description: "Your cheat sheet. One line per person showing the exact salary and bonus amounts to enter in Gusto. Don't guess, don't add them up yourself — it's right here.",
          position: 'bottom',
        },
      },
      {
        element: '[data-tour="person-card"]',
        popover: {
          title: '👤 Per-Person Breakdown',
          description: "Each person shows base pay and bonus separately. Click 'see breakdown' to see exactly which spiffs and prizes make up their bonus. If something looks wrong, this is where you'll catch it.",
          position: 'right',
        },
      },
      {
        element: '[data-tour="person-card"]',
        popover: {
          title: '✏️ Edit if Needed',
          description: 'Hover over any card to edit amounts or delete a line item. Use the Add Item button to add one-time adjustments like a signing bonus or correction.',
          position: 'right',
        },
      },
      {
        element: '[data-tour="confirm-run-btn"]',
        popover: {
          title: '🛑 Point of No Return',
          description: "⚠️ Do NOT click this during the guide. When you click Confirm & Run Payroll for real, expenses are created, records are marked paid, and loot wins are logged. Only do this when everything looks right.",
          position: 'top',
        },
      },
      {
        popover: {
          title: '↩️ Made a Mistake?',
          description: "No panic. Open Run Payroll again, scroll to the bottom of the first screen, and click 'Undo a previous payroll run.' Pick the date, and it will delete all expenses from that run and revert performance pay records. Always undo before touching anything in Gusto.",
          position: 'mid-center',
        },
        onNext: () => {
          setRunPayrollModalOpen(false);
          return new Promise(resolve => setTimeout(resolve, 400));
        },
      },
      {
        popover: {
          title: "✅ You're Ready",
          description: "First check takes about 10 minutes. Second check takes 3. When something looks off — undo first, investigate, then re-run. Exit this guide and run payroll for real when you're ready.",
          position: 'mid-center',
        },
      },
    ];

    driver.defineSteps(steps);
    driver.start();
  };

  return (
    <button
      onClick={startTour}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors"
    >
      ▶ How to Run Payroll
    </button>
  );
}