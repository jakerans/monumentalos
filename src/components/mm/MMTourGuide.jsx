import React from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

export default function MMTourGuide() {
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
            title: '👋 Welcome to Your Dashboard',
            description: 'This guide walks you through the Marketing Manager workspace — where you monitor all client accounts, track performance, and manage your tasks. Takes about 2 minutes.',
          },
        },
        {
          element: '[data-tour="mm-date-range"]',
          popover: {
            title: '📅 Date Range',
            description: 'Control what time period you\'re looking at. All stats, metrics, and client data below update based on this selection. Default is the current period.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="mm-top-stats"]',
          popover: {
            title: '📊 Portfolio Overview',
            description: 'Your high-level numbers at a glance — total active clients, appointments set, total ad spend, average CPA, speed to lead, and how many clients have alerts. These reflect the selected date range.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="mm-chart-toggle"]',
          popover: {
            title: '📈 Lead Breakdown Chart',
            description: 'Toggle this to see a visual breakdown of leads and appointments by client. Useful for spotting which accounts are performing and which need attention.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="mm-client-table"]',
          popover: {
            title: '📋 Client Table',
            description: 'Your main working view. Every active client with their key metrics — spend, leads, appointments, CPA, show rate, and speed to lead. Red alerts flag accounts that need attention. Click any client to see more detail in the side panel.',
            side: 'top',
          },
        },
        {
          element: '[data-tour="mm-right-panel"]',
          popover: {
            title: '👁 Side Panel',
            description: 'When no client is selected, this shows your performance goals and task board. Click a client in the table and it switches to a quick view of that account with detailed metrics and actions.',
            side: 'left',
          },
        },
        {
          element: '[data-tour="mm-onboard-link"]',
          popover: {
            title: '📋 Onboarding Tasks',
            description: 'When new clients are being onboarded, you\'ll see a notification badge here. Click to view your assigned onboarding tasks — complete them in order as each new client gets set up.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="mm-view-switcher"]',
          popover: {
            title: '🔄 Switch Views',
            description: 'If you have admin access, use this to switch between the MM view, Admin view, and Setter view without logging out.',
            side: 'bottom',
          },
        },
        {
          popover: {
            title: '🚀 You\'re Ready',
            description: 'Your daily flow: Check top stats for alerts → Review flagged clients in the table → Click into problem accounts → Complete any onboarding tasks. If something looks off with a client, dig into their metrics here first.',
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
      <HelpCircle className="w-3.5 h-3.5" />
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
        Workspace Guide
      </div>
    </button>
  );
}