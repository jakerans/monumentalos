import React from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

export default function SetterTourGuide() {
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
            title: '👋 Welcome to Your Workspace',
            description: 'This guide walks you through your daily workflow — from clocking in to working leads. Takes about 2 minutes. Nothing will change — just a walkthrough.',
          },
        },
        {
          element: '[data-tour="clock-widget"]',
          popover: {
            title: '⏱️ Clock In/Out',
            description: 'Start every shift by clocking in here. You\'ll see your scheduled shift time, a live timer while you\'re working, and your weekly/monthly hours. Always clock out when your shift ends.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="checklist-button"]',
          popover: {
            title: '✅ Daily Checklist',
            description: 'After you clock in, your daily checklist pops up automatically. Complete each task in order — some include Slack updates you can copy and paste. If you dismiss it, this button brings it back.',
            side: 'top',
          },
        },
        {
          element: '[data-tour="quick-links"]',
          popover: {
            title: '🔗 Quick Links',
            description: 'Quick access to your external tools — dialer, messenger, email, and anything else your admin has set up. Each icon opens in a new tab.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="setter-stats"]',
          popover: {
            title: '📊 Your Stats',
            description: 'Your real-time performance for the current period — leads contacted, appointments booked, show rate, and speed to lead. This updates live as you work.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="dial-workspace-btn"]',
          popover: {
            title: '📞 Dial Workspace',
            description: 'This is your main calling tool. Click to open a full-screen workspace where you can search leads, see who needs follow-up, log first call results, and book appointments. This is where you\'ll spend most of your time.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="pipeline-columns"]',
          popover: {
            title: '📋 Lead Pipeline',
            description: 'Your leads organized by status — New, In Progress, and Booked. Click any lead card to see full details, update disposition, or book an appointment. Use the filter and search bar above to narrow down by client.',
            side: 'top',
          },
        },
        {
          element: '[data-tour="schedule-tab"]',
          popover: {
            title: '📅 My Schedule',
            description: 'Check your upcoming shifts for this week and next, view your PTO balance, and submit time-off requests. Your schedule is set by your admin.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="earnings-tab"]',
          popover: {
            title: '💰 My Earnings',
            description: 'See your estimated pay breakdown — base pay, spiff bonuses, and booking reward cash prizes. Updates as you book appointments and hit bonus thresholds.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="inventory-btn"]',
          popover: {
            title: '📦 Rewards Inventory',
            description: 'When you book appointments, you earn booking rewards. Open them here to win prizes — cash bonuses, PTO days, and more. Don\'t let your inventory fill up or you\'ll stop earning booking rewards.',
            side: 'bottom',
          },
        },
        {
          popover: {
            title: '🚀 You\'re Ready',
            description: 'Your daily flow: Clock in → Complete checklist → Open Dial Workspace → Work leads → Book appointments → Clock out. Any questions, ask your manager. Good luck!',
          },
        },
      ],
    });

    driverObj.drive();
  };

  return (
    <button
      onClick={startTour}
      title="Workspace Guide"
      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative group"
    >
      <HelpCircle className="w-4 h-4" />
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
        Workspace Guide
      </div>
    </button>
  );
}