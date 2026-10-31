// Brightloop Application Router — Complete Route Configuration
// Covers all 54-endpoint modules, customer portal, novelty features, and auth flows

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
   SALES (FullLayout)
═══════════════════════════════════════ */
const CustomerList = Loadable(lazy(() => import('../views/customers/CustomerList')));
const CustomerDetail = Loadable(lazy(() => import('../views/customers/CustomerDetail')));
const Quotations = Loadable(lazy(() => import('../views/sales/Quotations')));
const QuotationTemplates = Loadable(lazy(() => import('../views/sales/QuotationTemplates')));

/* ═══════════════════════════════════════
   CATALOG (FullLayout)
═══════════════════════════════════════ */
const Products = Loadable(lazy(() => import('../views/catalog/Products')));
const ProductVariants = Loadable(lazy(() => import('../views/catalog/ProductVariants')));
const SubscriptionPlans = Loadable(lazy(() => import('../views/catalog/SubscriptionPlans')));

/* ═══════════════════════════════════════
   PRICING (FullLayout)
═══════════════════════════════════════ */
const Taxes = Loadable(lazy(() => import('../views/pricing/Taxes')));
const Discounts = Loadable(lazy(() => import('../views/pricing/Discounts')));
const DiscountGuardrail = Loadable(lazy(() => import('../views/pricing/DiscountGuardrail')));

/* ═══════════════════════════════════════
   SUBSCRIPTIONS (FullLayout)
═══════════════════════════════════════ */
const SubscriptionList = Loadable(lazy(() => import('../views/subscriptions/SubscriptionList')));
const SubscriptionDetail = Loadable(lazy(() => import('../views/subscriptions/SubscriptionDetail')));
const RenewalRadar = Loadable(lazy(() => import('../views/subscriptions/RenewalRadar')));

/* ═══════════════════════════════════════
   BILLING (FullLayout)
═══════════════════════════════════════ */
const Invoices = Loadable(lazy(() => import('../views/billing/Invoices')));
const BillingRuns = Loadable(lazy(() => import('../views/billing/BillingRuns')));

/* ═══════════════════════════════════════
   PAYMENTS (FullLayout)
═══════════════════════════════════════ */
const Payments = Loadable(lazy(() => import('../views/payments/Payments')));
const BankMatcher = Loadable(lazy(() => import('../views/payments/BankMatcher')));

/* ═══════════════════════════════════════
   INTELLIGENCE (Novelties N2, N4)
═══════════════════════════════════════ */
const IntegrityAuditor = Loadable(lazy(() => import('../views/intelligence/IntegrityAuditor')));
const BillExplainer = Loadable(lazy(() => import('../views/intelligence/BillExplainer')));

/* ═══════════════════════════════════════
   REPORTS (FullLayout)
═══════════════════════════════════════ */
const FinanceReports = Loadable(lazy(() => import('../views/reports/FinanceReports')));

/* ═══════════════════════════════════════
   NOTIFICATIONS (FullLayout)
═══════════════════════════════════════ */
const NotificationsPage = Loadable(lazy(() => import('../views/notifications/Notifications')));

/* ═══════════════════════════════════════
   ADMINISTRATION (FullLayout)
═══════════════════════════════════════ */
const StaffManagement = Loadable(lazy(() => import('../views/admin/StaffManagement')));
const Outbox = Loadable(lazy(() => import('../views/admin/Outbox')));
const Settings = Loadable(lazy(() => import('../views/admin/Settings')));

/* ═══════════════════════════════════════
   CUSTOMER PORTAL (PortalLayout)
═══════════════════════════════════════ */
const PortalDashboard = Loadable(lazy(() => import('../views/portal/PortalDashboard')));
const PortalSubscriptions = Loadable(lazy(() => import('../views/portal/PortalSubscriptions')));
const PortalInvoices = Loadable(lazy(() => import('../views/portal/PortalInvoices')));
const PortalPayments = Loadable(lazy(() => import('../views/portal/PortalPayments')));
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

      // ── Sales ─────────────────────────────────────────────────────────────────
      { path: '/customers', element: <CustomerList /> },
      { path: '/customers/:id', element: <CustomerDetail /> },
      { path: '/quotations', element: <Quotations /> },
      { path: '/quotation-templates', element: <QuotationTemplates /> },

      // ── Catalog ───────────────────────────────────────────────────────────────
      { path: '/products', element: <Products /> },
      { path: '/catalog/products', element: <Products /> },
      { path: '/product-variants', element: <ProductVariants /> },
      { path: '/catalog/variants', element: <ProductVariants /> },
      { path: '/subscription-plans', element: <SubscriptionPlans /> },
      { path: '/catalog/plans', element: <SubscriptionPlans /> },

      // ── Pricing ───────────────────────────────────────────────────────────────
      { path: '/taxes', element: <Taxes /> },
      { path: '/catalog/taxes', element: <Taxes /> },
      { path: '/discounts', element: <Discounts /> },
      { path: '/catalog/discounts', element: <Discounts /> },
      { path: '/discount-guardrail', element: <DiscountGuardrail /> },

      // ── Subscriptions ─────────────────────────────────────────────────────────
      { path: '/subscriptions', element: <SubscriptionList /> },
      { path: '/subscriptions/:id', element: <SubscriptionDetail /> },
      { path: '/renewal-radar', element: <RenewalRadar /> },

      // ── Billing ───────────────────────────────────────────────────────────────
      { path: '/invoices', element: <Invoices /> },
      { path: '/billing-runs', element: <BillingRuns /> },

      // ── Payments ──────────────────────────────────────────────────────────────
      { path: '/payments', element: <Payments /> },
      { path: '/bank-matcher', element: <BankMatcher /> },

      // ── Intelligence (Novelties N2, N4) ───────────────────────────────────────
      { path: '/integrity-auditor', element: <IntegrityAuditor /> },
      { path: '/bill-explainer', element: <BillExplainer /> },

      // ── Reports ───────────────────────────────────────────────────────────────
      { path: '/reports', element: <FinanceReports /> },

      // ── Notifications ─────────────────────────────────────────────────────────
      { path: '/notifications', element: <NotificationsPage /> },

      // ── Administration ────────────────────────────────────────────────────────
      { path: '/staff', element: <StaffManagement /> },
      { path: '/admin/staff', element: <StaffManagement /> },
      { path: '/outbox', element: <Outbox /> },
      { path: '/settings', element: <Settings /> },

      // ── Error within layout ───────────────────────────────────────────────────
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
      { path: '/portal/profile', element: <PortalProfile /> },
      { path: '*', element: <Navigate to="/portal/dashboard" replace /> },
    ],
  },

  // ─── Auth / Public (Blank Layout) ───────────────────────────────────────────
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      // Brightloop Auth routes
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

      // Redirect legacy paths
      { path: '/auth/auth2/login', element: <Navigate to="/auth/login" replace /> },
      { path: '/auth/auth2/register', element: <Navigate to="/auth/signup" replace /> },
      { path: '/auth/auth2/forgot-password', element: <Navigate to="/auth/forgot-password" replace /> },
      { path: '/auth/maintenance', element: <Navigate to="/dashboard" replace /> },
      { path: '404', element: <NotFound /> },

      { path: '*', element: <Navigate to="/auth/404" replace /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
