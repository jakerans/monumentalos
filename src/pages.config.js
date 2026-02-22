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
import AccountingCashFlow from './pages/AccountingCashFlow';
import AccountingClients from './pages/AccountingClients';
import AccountingExpenses from './pages/AccountingExpenses';
import AccountingPL from './pages/AccountingPL';
import AdminDashboard from './pages/AdminDashboard';
import AppointmentHistory from './pages/AppointmentHistory';
import BankAccountSettings from './pages/BankAccountSettings';
import ClientManagement from './pages/ClientManagement';
import ClientPerformance from './pages/ClientPerformance';
import ClientPortal from './pages/ClientPortal';
import ClientProfitability from './pages/ClientProfitability';
import ClientReport from './pages/ClientReport';
import ClientSettings from './pages/ClientSettings';
import ClientView from './pages/ClientView';
import EmployeeManagement from './pages/EmployeeManagement';
import FinanceAdminDashboard from './pages/FinanceAdminDashboard';
import HealthMonitor from './pages/HealthMonitor';
import LeadDetails from './pages/LeadDetails';
import LeadFieldSettings from './pages/LeadFieldSettings';
import LootAdmin from './pages/LootAdmin';
import MMDashboard from './pages/MMDashboard';
import MMOnboard from './pages/MMOnboard';
import MonthlyBilling from './pages/MonthlyBilling';
import OnboardDashboard from './pages/OnboardDashboard';
import PreviewEffects from './pages/PreviewEffects';
import SetterDashboard from './pages/SetterDashboard';
import SetterPerformance from './pages/SetterPerformance';
import SetterStats from './pages/SetterStats';
import ShiftChecklistSettings from './pages/ShiftChecklistSettings';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountPending": AccountPending,
    "AccountingCashFlow": AccountingCashFlow,
    "AccountingClients": AccountingClients,
    "AccountingExpenses": AccountingExpenses,
    "AccountingPL": AccountingPL,
    "AdminDashboard": AdminDashboard,
    "AppointmentHistory": AppointmentHistory,
    "BankAccountSettings": BankAccountSettings,
    "ClientManagement": ClientManagement,
    "ClientPerformance": ClientPerformance,
    "ClientPortal": ClientPortal,
    "ClientProfitability": ClientProfitability,
    "ClientReport": ClientReport,
    "ClientSettings": ClientSettings,
    "ClientView": ClientView,
    "EmployeeManagement": EmployeeManagement,
    "FinanceAdminDashboard": FinanceAdminDashboard,
    "HealthMonitor": HealthMonitor,
    "LeadDetails": LeadDetails,
    "LeadFieldSettings": LeadFieldSettings,
    "LootAdmin": LootAdmin,
    "MMDashboard": MMDashboard,
    "MMOnboard": MMOnboard,
    "MonthlyBilling": MonthlyBilling,
    "OnboardDashboard": OnboardDashboard,
    "PreviewEffects": PreviewEffects,
    "SetterDashboard": SetterDashboard,
    "SetterPerformance": SetterPerformance,
    "SetterStats": SetterStats,
    "ShiftChecklistSettings": ShiftChecklistSettings,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};