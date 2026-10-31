// Brightloop Notifications Page
// Shows all notifications for the current user with mark-as-read and delete actions

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from 'src/services/apiClient';
import { AppNotification } from 'src/types';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, AlertCircle, Info, CreditCard, FileText, Repeat, User } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { toast } from 'sonner';
import { cn } from 'src/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-4 h-4 text-blue-600" />,
  payment: <CreditCard className="w-4 h-4 text-emerald-600" />,
  subscription: <Repeat className="w-4 h-4 text-indigo-600" />,
  quotation: <FileText className="w-4 h-4 text-amber-600" />,
  account: <User className="w-4 h-4 text-purple-600" />,
  system: <Info className="w-4 h-4 text-gray-600" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  invoice: 'bg-blue-100 dark:bg-blue-950',
  payment: 'bg-emerald-100 dark:bg-emerald-950',
  subscription: 'bg-indigo-100 dark:bg-indigo-950',
  quotation: 'bg-amber-100 dark:bg-amber-950',
  account: 'bg-purple-100 dark:bg-purple-950',
  system: 'bg-gray-100 dark:bg-gray-900',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30',
  high: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30',
  normal: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30',
  low: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/30',
};

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { category?: string; unread?: boolean } = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (readFilter === 'unread') params.unread = true;
      const data = await apiClient.getNotifications(params);
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
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
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
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
  const displayedNotifications = readFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">{unreadCount} unread</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            System alerts, billing events, and account updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading} className="h-8 text-xs gap-1.5">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={handleMarkAllRead} disabled={markingAll} className="h-8 text-xs gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="quotation">Quotation</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        <Select value={readFilter} onValueChange={(v) => setReadFilter(v ?? 'all')}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading notifications…</p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNotifications}>Retry</Button>
          </CardContent>
        </Card>
      ) : displayedNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Bell className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground">
              {readFilter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here as activity occurs.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              {displayedNotifications.length} notification{displayedNotifications.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {displayedNotifications.map(notif => {
              const Icon = CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.system;
              const bgColor = CATEGORY_COLORS[notif.category] || CATEGORY_COLORS.system;
              return (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 p-4 transition hover:bg-secondary/20 cursor-pointer',
                    !notif.is_read && 'bg-blue-50/40 dark:bg-blue-950/10'
                  )}
                  onClick={() => handleMarkRead(notif)}
                >
                  {/* Icon */}
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', bgColor)}>
                    {Icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-semibold text-sm', !notif.is_read ? 'text-foreground' : 'text-muted-foreground')}>
                        {notif.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] h-4 px-1.5 border capitalize', PRIORITY_COLORS[notif.priority])}
                      >
                        {notif.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                        {notif.category}
                      </Badge>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{formatTime(notif.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950"
                        onClick={e => { e.stopPropagation(); handleMarkRead(notif); }}
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={e => { e.stopPropagation(); handleDelete(notif.id); }}
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPage;
