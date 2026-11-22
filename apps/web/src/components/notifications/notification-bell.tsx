"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notification-api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck, ShoppingBag, CreditCard, Truck, User, Sparkles } from "lucide-react";
import { NotificationType } from "@veyora/types";

const NOTIF_ICONS: Record<NotificationType, React.ElementType> = {
  order: ShoppingBag,
  payment: CreditCard,
  shipping: Truck,
  account: User,
  system: Sparkles,
};

export function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  // 1. Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // 2. Fetch recent notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.listNotifications({ limit: 6 }),
    enabled: isAuthenticated && open,
  });

  // 3. Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // 4. Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  if (!isAuthenticated) return null;

  const unreadCount = countData?.unreadCount || 0;
  const notifications = notificationsData?.items || [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-accent/60 h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl p-0 shadow-lg border-border/80 bg-popover"
      >
        <div className="flex items-center justify-between p-3.5 border-b">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Loading atelier notices...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Bell className="h-7 w-7 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground">No notices right now</p>
              <p className="text-[11px] text-muted-foreground">
                You will receive updates on your orders and concierge dispatches here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = NOTIF_ICONS[notif.type] || Sparkles;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) markReadMutation.mutate(notif.id);
                  }}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-muted/40 ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      !notif.isRead
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 space-y-1 text-xs min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`font-semibold truncate ${!notif.isRead ? "text-foreground font-bold" : "text-muted-foreground"}`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.actionUrl && (
                      <Link
                        href={notif.actionUrl}
                        className="text-[11px] text-primary hover:underline font-medium inline-block pt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          if (!notif.isRead) markReadMutation.mutate(notif.id);
                        }}
                      >
                        View Details →
                      </Link>
                    )}
                  </div>

                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
