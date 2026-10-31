// Brightloop Sidebar Menu Items Configuration
// Mapped strictly to Section 4 Application Navigation and Novelty features

import {
  BarChart3,
  Users,
  FileSpreadsheet,
  FileText,
  Package,
  Layers,
  CalendarDays,
  Percent,
  Receipt,
  ShieldAlert,
  Repeat,
  Radio,
  CreditCard,
  Building2,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Inbox,
  Settings,
  UserCog,
  LucideIcon,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: string;
  to?: string;
  url?: string;
  items?: MenuItem[];
  badge?: boolean;
  badgeContent?: string;
  badgeType?: 'primary' | 'secondary' | 'warning' | 'teal' | 'danger';
  adminOnly?: boolean;
  color?: string;
  isPro?: boolean;
  external?: boolean;
}

export type ChildItem = MenuItem;

export const getSidebarItems = (role: 'admin' | 'staff' | 'customer'): MenuItem[] => {
  if (role === 'customer') {
    // Dedicated Customer Portal Navigation
    return [
      {
        heading: 'CUSTOMER PORTAL',
      },
      {
        id: 'cust-overview',
        name: 'My Dashboard',
        icon: BarChart3,
        to: '/portal',
      },
      {
        id: 'cust-subs',
        name: 'My Subscriptions',
        icon: Repeat,
        to: '/portal/subscriptions',
      },
      {
        id: 'cust-invs',
        name: 'My Invoices',
        icon: FileText,
        to: '/portal/invoices',
      },
      {
        id: 'cust-pays',
        name: 'Payment History',
        icon: CreditCard,
        to: '/portal/payments',
      },
      {
        id: 'cust-prof',
        name: 'Company Profile',
        icon: Building2,
        to: '/portal/profile',
      },
    ];
  }

  // Internal Management Navigation (Admin & Staff)
  const items: MenuItem[] = [
    // 1. OVERVIEW
    {
      heading: 'OVERVIEW',
    },
    {
      id: 'nav-dashboard',
      name: 'Finance Dashboard',
      icon: BarChart3,
      to: '/',
    },

    // 2. SALES
    {
      heading: 'SALES',
    },
    {
      id: 'nav-customers',
      name: 'Customers',
      icon: Users,
      to: '/customers',
    },
    {
      id: 'nav-quotations',
      name: 'Quotations',
      icon: FileSpreadsheet,
      to: '/quotations',
    },
    {
      id: 'nav-templates',
      name: 'Quotation Templates',
      icon: FileCheck2,
      to: '/quotation-templates',
    },

    // 3. CATALOG
    {
      heading: 'CATALOG',
    },
    {
      id: 'nav-products',
      name: 'Products',
      icon: Package,
      to: '/products',
    },
    {
      id: 'nav-variants',
      name: 'Product Variants',
      icon: Layers,
      to: '/product-variants',
    },
    {
      id: 'nav-plans',
      name: 'Subscription Plans',
      icon: CalendarDays,
      to: '/subscription-plans',
    },

    // 4. PRICING
    {
      heading: 'PRICING',
    },
    {
      id: 'nav-taxes',
      name: 'Taxes',
      icon: Receipt,
      to: '/taxes',
    },
    {
      id: 'nav-discounts',
      name: 'Discounts',
      icon: Percent,
      to: '/discounts',
    },
    {
      id: 'nav-guardrail',
      name: 'Discount Guardrail',
      icon: ShieldAlert,
      to: '/discount-guardrail',
      badge: true,
      badgeContent: 'N1',
      badgeType: 'teal',
    },

    // 5. SUBSCRIPTIONS
    {
      heading: 'SUBSCRIPTIONS',
    },
    {
      id: 'nav-all-subs',
      name: 'All Subscriptions',
      icon: Repeat,
      to: '/subscriptions',
    },
    {
      id: 'nav-radar',
      name: 'Renewal Radar',
      icon: Radio,
      to: '/renewal-radar',
      badge: true,
      badgeContent: 'N5',
      badgeType: 'teal',
    },

    // 6. BILLING
    {
      heading: 'BILLING',
    },
    {
      id: 'nav-invoices',
      name: 'Invoices',
      icon: FileText,
      to: '/invoices',
    },
    {
      id: 'nav-billing-runs',
      name: 'Billing Runs',
      icon: TrendingUp,
      to: '/billing-runs',
    },

    // 7. PAYMENTS
    {
      heading: 'PAYMENTS',
    },
    {
      id: 'nav-payments',
      name: 'Payment Records',
      icon: CreditCard,
      to: '/payments',
    },
    {
      id: 'nav-bank-matcher',
      name: 'Bank Matcher',
      icon: DollarSign,
      to: '/bank-matcher',
      badge: true,
      badgeContent: 'N3',
      badgeType: 'teal',
    },

    // 8. INTELLIGENCE
    {
      heading: 'INTELLIGENCE',
    },
    {
      id: 'nav-integrity',
      name: 'Integrity Auditor',
      icon: Sparkles,
      to: '/integrity-auditor',
      badge: true,
      badgeContent: 'N2',
      badgeType: 'teal',
    },
    {
      id: 'nav-explainer',
      name: 'Bill Change Explainer',
      icon: HelpCircle,
      to: '/bill-explainer',
      badge: true,
      badgeContent: 'N4',
      badgeType: 'teal',
    },

    // 9. REPORTS
    {
      heading: 'REPORTS',
    },
    {
      id: 'nav-reports',
      name: 'Finance Reports',
      icon: BarChart3,
      to: '/reports',
    },

    // 10. ADMINISTRATION
    {
      heading: 'ADMINISTRATION',
    },
  ];

  // Admin-only Staff Management (strictly hidden from staff and customer)
  if (role === 'admin') {
    items.push({
      id: 'nav-staff',
      name: 'Staff Management',
      icon: UserCog,
      to: '/staff-management',
      adminOnly: true,
    });
  }

  items.push(
    {
      id: 'nav-outbox',
      name: 'Outbox',
      icon: Inbox,
      to: '/outbox',
      badge: true,
      badgeContent: 'N6',
      badgeType: 'secondary',
    },
    {
      id: 'nav-settings',
      name: 'Settings',
      icon: Settings,
      to: '/settings',
    }
  );

  return items;
};

export const SidebarContent = getSidebarItems('admin');
export default SidebarContent;
