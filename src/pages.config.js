/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AppointmentHistory from './pages/AppointmentHistory';
import ClientManagement from './pages/ClientManagement';
import ClientPortal from './pages/ClientPortal';
import ClientReport from './pages/ClientReport';
import ClientSettings from './pages/ClientSettings';
import ClientView from './pages/ClientView';
import LeadDetails from './pages/LeadDetails';
import MMDashboard from './pages/MMDashboard';
import MMOnboard from './pages/MMOnboard';
import OnboardDashboard from './pages/OnboardDashboard';
import RevenueDashboard from './pages/RevenueDashboard';
import SetterDashboard from './pages/SetterDashboard';
import SetterPerformance from './pages/SetterPerformance';
import MonthlyBilling from './pages/MonthlyBilling';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AppointmentHistory": AppointmentHistory,
    "ClientManagement": ClientManagement,
    "ClientPortal": ClientPortal,
    "ClientReport": ClientReport,
    "ClientSettings": ClientSettings,
    "ClientView": ClientView,
    "LeadDetails": LeadDetails,
    "MMDashboard": MMDashboard,
    "MMOnboard": MMOnboard,
    "OnboardDashboard": OnboardDashboard,
    "RevenueDashboard": RevenueDashboard,
    "SetterDashboard": SetterDashboard,
    "SetterPerformance": SetterPerformance,
    "MonthlyBilling": MonthlyBilling,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
};