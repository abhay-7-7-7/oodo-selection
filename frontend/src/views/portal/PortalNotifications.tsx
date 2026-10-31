// Brightloop Customer Portal: Notifications Center
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from 'src/services/apiClient';
import { AppNotification } from 'src/types';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  FileText,
  CreditCard,
  Repeat,
  Info,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { formatDate } from 'src/utils/calculations';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-4 h-4 text-blue-600" />,
  payment: <CreditCard className="w-4 h-4 text-emerald-600" />,
  subscription: <Repeat className="w-4 h-4 text-indigo-600" />,
  quotation: <FileText className="w-4 h-4 text-amber-600" />,
  account: <User className="w-4 h-4 text-purple-600" />,
  system: <Info className="w-4 h-4 text-gray-600" />,
};

export const PortalNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: { category?: string; unread?: boolean } = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (readFilter === 'unread') params.unread = true;
      const data = await apiClient.getNotifications(params);
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, readFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (notif: AppNotification) => {
    if (notif.is_read) return;
    try {
      await apiClient.markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Notifications & Billing Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs font-bold">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Stay informed about your subscription renewals, invoices, and payment confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              Mark all as read
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border p-3.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Filter Category:</span>
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'all')}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="subscription">Subscriptions</SelectItem>
              <SelectItem value="account">Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          <Select value={readFilter} onValueChange={(val) => setReadFilter(val || 'all')}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {loading && notifications.length === 0 ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-base text-foreground">No notifications found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {categoryFilter !== 'all' || readFilter !== 'all'
                  ? 'No notifications match your current filter criteria.'
                  : 'You are all caught up! Account and billing updates will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkRead(notif)}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                    notif.is_read
                      ? 'bg-card hover:bg-muted/40'
                      : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-secondary shrink-0 mt-0.5">
                      {CATEGORY_ICONS[notif.category] || <Bell className="w-4 h-4 text-blue-600" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            notif.is_read ? 'text-foreground' : 'text-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">{notif.category}</span>
                        <span>•</span>
                        <span>{formatDate(notif.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                        title="Mark as read"
                        onClick={() => handleMarkRead(notif)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete notification"
                      onClick={() => handleDelete(notif.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalNotificationsPage;
