import { useState, useEffect } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Bell, Check, CheckCheck, FileText, CreditCard, Repeat, Info, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { AppNotification } from "src/types";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    invoice: <FileText className="size-4 text-blue-600" />,
    payment: <CreditCard className="size-4 text-emerald-600" />,
    subscription: <Repeat className="size-4 text-indigo-600" />,
    quotation: <FileText className="size-4 text-amber-600" />,
    account: <User className="size-4 text-purple-600" />,
    system: <Info className="size-4 text-gray-600" />,
};

const CATEGORY_BG: Record<string, string> = {
    invoice: 'bg-blue-500/10',
    payment: 'bg-emerald-500/10',
    subscription: 'bg-indigo-500/10',
    quotation: 'bg-amber-500/10',
    account: 'bg-purple-500/10',
    system: 'bg-gray-500/10',
};

const formatRelativeTime = (ts: string) => {
    try {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    } catch {
        return '';
    }
};

const Notifications = ({ className }: { className?: string }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getNotifications({ unread: false });
            setNotifications(data.slice(0, 10)); // Show last 10
        } catch {
            // Silently fail in header dropdown
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkRead = async (notif: AppNotification) => {
        if (notif.is_read) return;
        try {
            await apiClient.markNotificationRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        } catch {
            // ignore
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {
            // ignore
        }
    };

    return (
        <div className={cn("", className)}>
            <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(); }}>
                <DropdownMenuTrigger>
                    <div className="relative cursor-pointer">
                        {unreadCount > 0 && (
                            <>
                                <span className="h-2.5 w-2.5 bg-destructive rounded-full absolute top-1 end-2 text-xs text-center text-white z-1 animate-ping" />
                                <span className="h-2.5 w-2.5 bg-destructive rounded-full absolute top-1 end-2 text-xs text-center text-white z-1" />
                            </>
                        )}
                        <div className="flex justify-center items-center hover:bg-primary/5 w-10 h-10 rounded-full">
                            <Bell className="size-5" />
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-screen sm:w-[360px] py-4 px-0"
                >
                    <div className="flex items-center px-4 justify-between mb-2">
                        <h3 className="text-base font-semibold">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Badge className="px-2 bg-primary dark:bg-primary hover:bg-primary text-xs">{unreadCount} new</Badge>
                            )}
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2 text-muted-foreground"
                                    onClick={handleMarkAllRead}
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                                    All read
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <SimpleBar className="max-h-80 mt-1">
                        <div className="flex flex-col">
                            {loading && notifications.length === 0 ? (
                                <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground">No notifications</div>
                            ) : (
                                notifications.map((notif) => {
                                    const icon = CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.system;
                                    const bg = CATEGORY_BG[notif.category] || CATEGORY_BG.system;
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleMarkRead(notif)}
                                            className={cn(
                                                "px-4 py-3 flex justify-between items-start hover:bg-primary/5 cursor-pointer transition",
                                                !notif.is_read && "bg-blue-50/40 dark:bg-blue-950/10"
                                            )}
                                        >
                                            <div className="flex items-start w-full gap-3">
                                                <div className={cn("h-9 w-9 shrink-0 rounded-full flex justify-center items-center", bg)}>
                                                    {icon}
                                                </div>
                                                <div className="flex justify-between w-full min-w-0">
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className={cn("mb-0.5 text-xs", !notif.is_read && "font-semibold")}>
                                                            {notif.title}
                                                        </h5>
                                                        <div className="text-[11px] text-muted-foreground line-clamp-2">
                                                            {notif.message}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                                                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                            {formatRelativeTime(notif.created_at)}
                                                        </div>
                                                        {!notif.is_read && (
                                                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </SimpleBar>

                    {/* Footer Button */}
                    <div className="pt-3 px-4 border-t border-border mt-2">
                        <Button className="w-full text-xs h-8" variant="outline" render={<Link to="/notifications" />}>
                            See All Notifications
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default Notifications;
