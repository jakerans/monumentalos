import React from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

export default function ClientPerformanceTourGuide() {
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
            title: '👋 Welcome to Your Appointment Portal',
            description: 'This guide walks you through your appointment dashboard — where you see what our team has booked for you, confirm outcomes, and track your results. Takes about 2 minutes.',
          },
        },
        {
          element: '[data-tour="performance-kpis"]',
          popover: {
            title: '📊 Your Appointment Stats',
            description: "Your key numbers at a glance — appointments booked this month, your show rate, how many showed, and how many need your input. The 'Needs Outcome' count is your action item.",
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="performance-action-queue"]',
          popover: {
            title: '🔴 Confirm Outcomes',
            description: "This is your most important section. These appointments already happened — we need you to confirm whether the homeowner showed up and what the result was. Click 'Update Outcome' for a quick 2-click flow.",
            side: 'top',
          },
        },
        {
          element: '[data-tour="performance-outcome-btn"]',
          popover: {
            title: '⚡ Quick Update',
            description: 'Click this button to quickly confirm: Did they show? → Was it sold or not? If sold, enter the amount. Takes 10 seconds per appointment.',
            side: 'left',
          },
        },
        {
          element: '[data-tour="performance-upcoming"]',
          popover: {
            title: '📅 Upcoming Appointments',
            description: "Appointments our team has scheduled for you that haven't happened yet. Check this to see what's coming up. Once the appointment date passes, it'll move to the action queue above.",
            side: 'top',
          },
        },
        {
          element: '[data-tour="client-nav-history"]',
          popover: {
            title: '📜 Appointment History',
            description: 'All your past appointments with their outcomes — showed, cancelled, sold, not sold. Use filters to find specific results.',
            side: 'right',
          },
        },
        {
          element: '[data-tour="client-nav-report"]',
          popover: {
            title: '📈 Performance Report',
            description: 'Your detailed ROI report — ad spend, cost per appointment, show rate, close rate, revenue, and overall return on investment. Compare periods to track trends.',
            side: 'right',
          },
        },
        {
          popover: {
            title: "🚀 You're All Set",
            description: 'Your main job here: Confirm outcomes on appointments as soon as possible. The faster you update results, the more accurately we can optimize your campaigns. Check the Performance Report monthly to see your ROI.',
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