import React from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

export default function ClientRetainerTourGuide() {
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
            title: '👋 Welcome to Your Lead Portal',
            description: 'This guide walks you through your lead management workspace — where you track incoming leads, update their status, and manage your pipeline. Takes about 2 minutes.',
          },
        },
        {
          element: '[data-tour="retainer-kpis"]',
          popover: {
            title: '📊 Your Lead Stats',
            description: "A snapshot of your lead pipeline — new leads waiting to be contacted, how many you've reached, appointments booked, completed jobs, and disqualified leads. These update in real time.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="retainer-attention-banner"]',
          popover: {
            title: '⚠️ Needs Attention',
            description: "When leads have been sitting for more than 24 hours without being contacted, you'll see this alert. The faster you reach out, the better your conversion rate.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="retainer-lead-queue"]',
          popover: {
            title: '📋 Lead Queue',
            description: 'Your main working area. Leads are sorted by priority — new leads first, then contacted, then booked. Click any lead to see full details and update their status.',
            side: 'top',
          },
        },
        {
          element: '[data-tour="retainer-filters"]',
          popover: {
            title: '🔍 Filter & Search',
            description: 'Use the status filter to focus on specific lead stages, or search by name or phone number to find someone quickly.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="client-nav-history"]',
          popover: {
            title: '📜 Lead History',
            description: 'Once a lead is completed or disqualified, it moves to your history page. You can review past outcomes and filter by disposition or result.',
            side: 'right',
          },
        },
        {
          element: '[data-tour="client-nav-report"]',
          popover: {
            title: '📈 Performance Report',
            description: 'Your detailed performance report — ad spend, appointments, show rates, close rates, and ROI over any date range. Check this monthly to see how your marketing is performing.',
            side: 'right',
          },
        },
        {
          popover: {
            title: "🚀 You're All Set",
            description: 'Your daily flow: Check for new leads → Contact them quickly → Update their status → Book appointments → Track results in your Performance Report. The faster you follow up, the more jobs you\'ll close.',
          },
        },
      ],
    });
    driverObj.drive();
  };

  return (
    <button
      onClick={startTour}
      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors w-full"
    >
      <HelpCircle className="w-3.5 h-3.5" />
      How to use this portal
    </button>
  );
}