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
import AccountPending from './pages/AccountPending';
import AdminDashboard from './pages/AdminDashboard';
import AppointmentHistory from './pages/AppointmentHistory';
import ClientManagement from './pages/ClientManagement';
import ClientPerformance from './pages/ClientPerformance';
import ClientPortal from './pages/ClientPortal';
import ClientReport from './pages/ClientReport';
import ClientSettings from './pages/ClientSettings';
import ClientView from './pages/ClientView';
import EmployeeManagement from './pages/EmployeeManagement';
import HealthMonitor from './pages/HealthMonitor';
import LeadDetails from './pages/LeadDetails';
import MMDashboard from './pages/MMDashboard';
import MMOnboard from './pages/MMOnboard';
import MonthlyBilling from './pages/MonthlyBilling';
import OnboardDashboard from './pages/OnboardDashboard';
import RevenueDashboard from './pages/RevenueDashboard';
import SetterPerformance from './pages/SetterPerformance';
import UserManagement from './pages/UserManagement';
import SetterDashboard from './pages/SetterDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountPending": AccountPending,
    "AdminDashboard": AdminDashboard,
    "AppointmentHistory": AppointmentHistory,
    "ClientManagement": ClientManagement,
    "ClientPerformance": ClientPerformance,
    "ClientPortal": ClientPortal,
    "ClientReport": ClientReport,
    "ClientSettings": ClientSettings,
    "ClientView": ClientView,
    "EmployeeManagement": EmployeeManagement,
    "HealthMonitor": HealthMonitor,
    "LeadDetails": LeadDetails,
    "MMDashboard": MMDashboard,
    "MMOnboard": MMOnboard,
    "MonthlyBilling": MonthlyBilling,
    "OnboardDashboard": OnboardDashboard,
    "RevenueDashboard": RevenueDashboard,
    "SetterPerformance": SetterPerformance,
    "UserManagement": UserManagement,
    "SetterDashboard": SetterDashboard,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};