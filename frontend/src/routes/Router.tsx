// Brightloop Application Router — Complete Route Configuration
// Covers all core business modules, role-based navigation, customer portal, and auth flows

import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ═══════════════════════════════════════
   LAYOUTS
═══════════════════════════════════════ */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const PortalLayout = Loadable(lazy(() => import('../layouts/portal/PortalLayout')));

/* ═══════════════════════════════════════
   AUTHENTICATION (BlankLayout)
═══════════════════════════════════════ */
const Login = Loadable(lazy(() => import('../views/auth/Login')));
const SignUp = Loadable(lazy(() => import('../views/auth/SignUp')));
const ForgotPassword = Loadable(lazy(() => import('../views/auth/ForgotPassword')));
const ResetPassword = Loadable(lazy(() => import('../views/auth/ResetPassword')));
const AccessDenied = Loadable(lazy(() => import('../views/auth/AccessDenied')));
const NotFound = Loadable(lazy(() => import('../views/auth/NotFound')));

/* ═══════════════════════════════════════
   OVERVIEW (FullLayout)
═══════════════════════════════════════ */
const FinanceDashboard = Loadable(lazy(() => import('../views/dashboard/FinanceDashboard')));

/* ═══════════════════════════════════════
   CUSTOMER MANAGEMENT (FullLayout)
═══════════════════════════════════════ */
const CustomerList = Loadable(lazy(() => import('../views/customers/CustomerList')));
const CustomerDetail = Loadable(lazy(() => import('../views/customers/CustomerDetail')));

/* ═══════════════════════════════════════
   CATALOG (FullLayout)
═══════════════════════════════════════ */
const Products = Loadable(lazy(() => import('../views/catalog/Products')));
const ProductVariants = Loadable(lazy(() => import('../views/catalog/ProductVariants')));
const SubscriptionPlans = Loadable(lazy(() => import('../views/catalog/SubscriptionPlans')));
const Taxes = Loadable(lazy(() => import('../views/pricing/Taxes')));
const Discounts = Loadable(lazy(() => import('../views/pricing/Discounts')));

/* ═══════════════════════════════════════
   SUBSCRIPTIONS & SALES (FullLayout)
═══════════════════════════════════════ */
const Quotations = Loadable(lazy(() => import('../views/sales/Quotations')));
const QuotationTemplates = Loadable(lazy(() => import('../views/sales/QuotationTemplates')));
const SubscriptionList = Loadable(lazy(() => import('../views/subscriptions/SubscriptionList')));
const SubscriptionDetail = Loadable(lazy(() => import('../views/subscriptions/SubscriptionDetail')));
const BillingRuns = Loadable(lazy(() => import('../views/billing/BillingRuns')));

/* ═══════════════════════════════════════
   FINANCE (FullLayout)
═══════════════════════════════════════ */
const Invoices = Loadable(lazy(() => import('../views/billing/Invoices')));
const Payments = Loadable(lazy(() => import('../views/payments/Payments')));
const FinanceReports = Loadable(lazy(() => import('../views/reports/FinanceReports')));

/* ═══════════════════════════════════════
   COMMUNICATION (FullLayout)
═══════════════════════════════════════ */
const NotificationsPage = Loadable(lazy(() => import('../views/notifications/Notifications')));

/* ═══════════════════════════════════════
   ADMINISTRATION (FullLayout)
═══════════════════════════════════════ */
const StaffManagement = Loadable(lazy(() => import('../views/admin/StaffManagement')));
const Settings = Loadable(lazy(() => import('../views/admin/Settings')));
const ProfilePage = Loadable(lazy(() => import('../views/profile/Profile')));
const Outbox = Loadable(lazy(() => import('../views/admin/Outbox')));

/* ═══════════════════════════════════════
   NOVELTY WORKSPACES (Preserved)
═══════════════════════════════════════ */
const DiscountGuardrail = Loadable(lazy(() => import('../views/pricing/DiscountGuardrail')));
const RenewalRadar = Loadable(lazy(() => import('../views/subscriptions/RenewalRadar')));
const BankMatcher = Loadable(lazy(() => import('../views/payments/BankMatcher')));
const IntegrityAuditor = Loadable(lazy(() => import('../views/intelligence/IntegrityAuditor')));
const BillExplainer = Loadable(lazy(() => import('../views/intelligence/BillExplainer')));

/* ═══════════════════════════════════════
   CUSTOMER PORTAL (PortalLayout)
═══════════════════════════════════════ */
const PortalDashboard = Loadable(lazy(() => import('../views/portal/PortalDashboard')));
const PortalSubscriptions = Loadable(lazy(() => import('../views/portal/PortalSubscriptions')));
const PortalInvoices = Loadable(lazy(() => import('../views/portal/PortalInvoices')));
const PortalPayments = Loadable(lazy(() => import('../views/portal/PortalPayments')));
const PortalNotificationsPage = Loadable(lazy(() => import('../views/portal/PortalNotifications')));
const PortalProfile = Loadable(lazy(() => import('../views/portal/PortalProfile')));

/* ═══════════════════════════════════════
   ROUTE DEFINITIONS
═══════════════════════════════════════ */
const Router = [
  // ─── Internal Application (Full Shell Layout) ───────────────────────────────
  {
    path: '/',
    element: <FullLayout />,
    children: [
      // Root redirect
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/', element: <Navigate to="/dashboard" replace /> },

      // ── Overview ──────────────────────────────────────────────────────────────
      { path: '/dashboard', element: <FinanceDashboard /> },

      // ── Customer Management ───────────────────────────────────────────────────
      { path: '/customers', element: <CustomerList /> },
      { path: '/customers/:id', element: <CustomerDetail /> },

      // ── Catalog ───────────────────────────────────────────────────────────────
      { path: '/catalog/products', element: <Products /> },
      { path: '/products', element: <Products /> },
      { path: '/catalog/variants', element: <ProductVariants /> },
      { path: '/product-variants', element: <ProductVariants /> },
      { path: '/catalog/plans', element: <SubscriptionPlans /> },
      { path: '/subscription-plans', element: <SubscriptionPlans /> },
      { path: '/catalog/taxes', element: <Taxes /> },
      { path: '/taxes', element: <Taxes /> },
      { path: '/catalog/discounts', element: <Discounts /> },
      { path: '/discounts', element: <Discounts /> },

      // ── Subscriptions ─────────────────────────────────────────────────────────
      { path: '/quotations', element: <Quotations /> },
      { path: '/quotation-templates', element: <QuotationTemplates /> },
      { path: '/subscriptions', element: <SubscriptionList /> },
      { path: '/subscriptions/:id', element: <SubscriptionDetail /> },
      { path: '/billing-runs', element: <BillingRuns /> },

      // ── Finance ───────────────────────────────────────────────────────────────
      { path: '/invoices', element: <Invoices /> },
      { path: '/payments', element: <Payments /> },
      { path: '/reports', element: <FinanceReports /> },

      // ── Communication ─────────────────────────────────────────────────────────
      { path: '/notifications', element: <NotificationsPage /> },

      // ── Administration ────────────────────────────────────────────────────────
      { path: '/admin/staff', element: <StaffManagement /> },
      { path: '/staff', element: <StaffManagement /> },
      { path: '/staff-management', element: <Navigate to="/admin/staff" replace /> },
      { path: '/settings', element: <Settings /> },
      { path: '/profile', element: <ProfilePage /> },

      // ── Preserved Aux Modules ─────────────────────────────────────────────────
      { path: '/outbox', element: <Outbox /> },
      { path: '/discount-guardrail', element: <DiscountGuardrail /> },
      { path: '/renewal-radar', element: <RenewalRadar /> },
      { path: '/bank-matcher', element: <BankMatcher /> },
      { path: '/integrity-auditor', element: <IntegrityAuditor /> },
      { path: '/bill-explainer', element: <BillExplainer /> },

      // ── Catch-all inside internal layout ──────────────────────────────────────
      { path: '*', element: <Navigate to="/auth/404" replace /> },
    ],
  },

  // ─── Customer Portal (Portal Layout) ────────────────────────────────────────
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [
      { index: true, element: <Navigate to="/portal/dashboard" replace /> },
      { path: '/portal/dashboard', element: <PortalDashboard /> },
      { path: '/portal/subscriptions', element: <PortalSubscriptions /> },
      { path: '/portal/invoices', element: <PortalInvoices /> },
      { path: '/portal/payments', element: <PortalPayments /> },
      { path: '/portal/notifications', element: <PortalNotificationsPage /> },
      { path: '/portal/profile', element: <PortalProfile /> },
      { path: '*', element: <Navigate to="/portal/dashboard" replace /> },
    ],
  },

  // ─── Auth / Public (Blank Layout) ───────────────────────────────────────────
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/login', element: <Login /> },
      { path: '/auth/signup', element: <SignUp /> },
      { path: '/signup', element: <SignUp /> },
      { path: '/auth/forgot-password', element: <ForgotPassword /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/auth/reset-password', element: <ResetPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/auth/403', element: <AccessDenied /> },
      { path: '/auth/404', element: <NotFound /> },
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <Navigate to="/auth/404" replace /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
