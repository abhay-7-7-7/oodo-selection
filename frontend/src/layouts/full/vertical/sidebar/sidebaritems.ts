// Brightloop Sidebar Menu Items Configuration
// Strictly following core role-based navigation specification

import {
  BarChart3,
  Users,
  FileSpreadsheet,
  Package,
  Layers,
  CalendarDays,
  Percent,
  Receipt,
  Repeat,
  CreditCard,
  Building2,
  FileText,
  TrendingUp,
  Bell,
  UserCog,
  Settings,
  User,
  LucideIcon,
} from 'lucide-react';

export type ChildItem = MenuItem;

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

export const getSidebarItems = (role: 'admin' | 'staff' | 'customer'): MenuItem[] => {
  // ── Customer Portal Navigation ─────────────────────────────────────────────
  if (role === 'customer') {
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
        name: 'My Payments',
        icon: CreditCard,
        to: '/portal/payments',
      },
      {
        id: 'cust-notifs',
        name: 'My Notifications',
        icon: Bell,
        to: '/portal/notifications',
      },
      {
        id: 'cust-prof',
        name: 'My Profile',
        icon: Building2,
        to: '/portal/profile',
      },
    ];
  }

  // ── Staff Navigation (Permitted Operations Only) ───────────────────────────
  if (role === 'staff') {
    return [
      {
        heading: 'OVERVIEW',
      },
      {
        id: 'staff-dashboard',
        name: 'Dashboard',
        icon: BarChart3,
        to: '/dashboard',
      },
      {
        heading: 'CUSTOMER MANAGEMENT',
      },
      {
        id: 'staff-customers',
        name: 'Customers',
        icon: Users,
        to: '/customers',
      },
      {
        heading: 'SUBSCRIPTIONS',
      },
      {
        id: 'staff-quotations',
        name: 'Quotations',
        icon: FileSpreadsheet,
        to: '/quotations',
      },
      {
        id: 'staff-subscriptions',
        name: 'Subscriptions',
        icon: Repeat,
        to: '/subscriptions',
      },
      {
        id: 'staff-billing-runs',
        name: 'Billing Runs',
        icon: TrendingUp,
        to: '/billing-runs',
      },
      {
        heading: 'FINANCE',
      },
      {
        id: 'staff-invoices',
        name: 'Invoices',
        icon: FileText,
        to: '/invoices',
      },
      {
        id: 'staff-payments',
        name: 'Payments',
        icon: CreditCard,
        to: '/payments',
      },
      {
        id: 'staff-reports',
        name: 'Finance Reports',
        icon: BarChart3,
        to: '/reports',
      },
      {
        heading: 'COMMUNICATION',
      },
      {
        id: 'staff-notifications',
        name: 'Notification Centre',
        icon: Bell,
        to: '/notifications',
      },
      {
        heading: 'ADMINISTRATION',
      },
      {
        id: 'staff-profile',
        name: 'My Profile',
        icon: User,
        to: '/profile',
      },
    ];
  }

  // ── Admin Navigation (Full System Access) ──────────────────────────────────
  return [
    {
      heading: 'OVERVIEW',
    },
    {
      id: 'admin-dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      to: '/dashboard',
    },
    {
      heading: 'CUSTOMER MANAGEMENT',
    },
    {
      id: 'admin-customers',
      name: 'Customers',
      icon: Users,
      to: '/customers',
    },
    {
      heading: 'CATALOG',
    },
    {
      id: 'admin-products',
      name: 'Products',
      icon: Package,
      to: '/catalog/products',
    },
    {
      id: 'admin-variants',
      name: 'Product Variants',
      icon: Layers,
      to: '/catalog/variants',
    },
    {
      id: 'admin-plans',
      name: 'Subscription Plans',
      icon: CalendarDays,
      to: '/catalog/plans',
    },
    {
      id: 'admin-taxes',
      name: 'Taxes',
      icon: Receipt,
      to: '/catalog/taxes',
    },
    {
      id: 'admin-discounts',
      name: 'Discounts',
      icon: Percent,
      to: '/catalog/discounts',
    },
    {
      heading: 'SUBSCRIPTIONS',
    },
    {
      id: 'admin-quotations',
      name: 'Quotations',
      icon: FileSpreadsheet,
      to: '/quotations',
    },
    {
      id: 'admin-subscriptions',
      name: 'Subscriptions',
      icon: Repeat,
      to: '/subscriptions',
    },
    {
      id: 'admin-billing-runs',
      name: 'Billing Runs',
      icon: TrendingUp,
      to: '/billing-runs',
    },
    {
      heading: 'FINANCE',
    },
    {
      id: 'admin-invoices',
      name: 'Invoices',
      icon: FileText,
      to: '/invoices',
    },
    {
      id: 'admin-payments',
      name: 'Payments',
      icon: CreditCard,
      to: '/payments',
    },
    {
      id: 'admin-reports',
      name: 'Finance Reports',
      icon: BarChart3,
      to: '/reports',
    },
    {
      heading: 'COMMUNICATION',
    },
    {
      id: 'admin-notifications',
      name: 'Notification Centre',
      icon: Bell,
      to: '/notifications',
    },
    {
      heading: 'ADMINISTRATION',
    },
    {
      id: 'admin-users',
      name: 'User Management',
      icon: UserCog,
      to: '/admin/staff',
    },
    {
      id: 'admin-settings',
      name: 'Settings',
      icon: Settings,
      to: '/settings',
    },
    {
      id: 'admin-profile',
      name: 'My Profile',
      icon: User,
      to: '/profile',
    },
  ];
};

export const SidebarContent = getSidebarItems('admin');
export default SidebarContent;
