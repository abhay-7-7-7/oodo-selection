// Brightloop Notification & Activity Feed Data
import { LucideIcon, AlertTriangle, Radio, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export interface NotificationType {
  title: string;
  icon: LucideIcon;
  subtitle: string;
  bgcolor: string;
  color: string;
  time: string;
  isRead?: boolean;
}

export const Notification: NotificationType[] = [
  {
    icon: AlertTriangle,
    bgcolor: 'bg-red-500/10',
    color: 'text-red-600',
    title: 'Overdue Invoice Alert',
    subtitle: 'INV-2026-0101 (TechCorp) is overdue by 15 days',
    time: '10 mins ago',
    isRead: false,
  },
  {
    icon: Radio,
    bgcolor: 'bg-amber-500/10',
    color: 'text-amber-600',
    title: 'Renewal Radar: Urgency',
    subtitle: 'SUB-2026-0001 expires in 6 days. Renewal quote ready.',
    time: '45 mins ago',
    isRead: false,
  },
  {
    icon: CheckCircle2,
    bgcolor: 'bg-emerald-500/10',
    color: 'text-emerald-600',
    title: 'Bank Split Match Approved',
    subtitle: '₹23,600 deposit reconciled across 3 open invoices',
    time: '2 hours ago',
    isRead: false,
  },
  {
    icon: TrendingUp,
    bgcolor: 'bg-blue-500/10',
    color: 'text-blue-600',
    title: 'Billing Run Completed',
    subtitle: '2 invoices generated, 0 duplicates (UNIQUE guard held)',
    time: '1 day ago',
    isRead: true,
  },
  {
    icon: Sparkles,
    bgcolor: 'bg-teal-500/10',
    color: 'text-teal-600',
    title: 'Integrity Audit Passed',
    subtitle: 'All 3 integrity checks verified healthy with 0 anomalies',
    time: '2 days ago',
    isRead: true,
  },
];
