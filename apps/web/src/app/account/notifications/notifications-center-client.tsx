"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/common/protected-route";
import {
  useNotifications,
  useNotificationCount,
  useNotificationActions,
  NotificationFilter,
  getNotificationStyle,
  formatNotificationTime,
  resolveNotificationTargetUrl,
} from "@/components/notifications";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  RotateCcw,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationsCenterClient() {
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const { unreadCount } = useNotificationCount();
  const { notifications, total, totalPages, isLoading, isError, refetch } = useNotifications({
    page,
    limit: pageSize,
    unreadOnly: filter === "unread" ? true : undefined,
  });

  const { markAsRead, markAsUnread, markAllAsRead, deleteNotification, isMarkingAllRead } =
    useNotificationActions();

  // Reset page when filter changes
  const handleFilterChange = (newFilter: NotificationFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const displayedNotifications = React.useMemo(() => {
    if (filter === "read") {
      return notifications.filter((n) => n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-10 md:py-16 bg-background">
        <Container size="xl" className="space-y-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-foreground transition-colors">
              Account
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Notifications</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Atelier Notifications
                </h1>
                {unreadCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5"
                  >
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
                Review bespoke order transitions, payment receipts, concierge dispatches, and
                private atelier drop notices.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAllRead}
                  className="rounded-xl text-xs h-9 gap-1.5"
                >
                  <CheckCheck className="h-4 w-4 text-primary" />
                  <span>Mark all read</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Button
              type="button"
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("all")}
              className="rounded-full text-xs h-8 px-4 font-medium"
            >
              All Notices
            </Button>
            <Button
              type="button"
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("unread")}
              className="rounded-full text-xs h-8 px-4 font-medium gap-1.5"
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "h-4 min-w-4 px-1 rounded-full text-[10px] font-bold tabular-nums inline-flex items-center justify-center",
                    filter === "unread"
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant={filter === "read" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("read")}
              className="rounded-full text-xs h-8 px-4 font-medium"
            >
              Read
            </Button>
          </div>

          {/* Body Content */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-card p-4 flex items-start gap-4 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center space-y-3 max-w-md mx-auto my-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Unable to load notifications feed
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-1.5 rounded-full text-xs h-8"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </Button>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center space-y-3 max-w-md mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mx-auto">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {filter === "unread" ? "You're all caught up" : "No notices in your feed"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {filter === "unread"
                  ? "All atelier notices have been reviewed."
                  : "Real-time updates regarding your bespoke garments, order tracking, and seasonal drop invitations will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedNotifications.map((notif) => {
                const style = getNotificationStyle(notif.type);
                const Icon = style.icon;
                const timeStr = formatNotificationTime(notif.createdAt);
                const targetUrl = resolveNotificationTargetUrl(notif);

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "group rounded-2xl border transition-all duration-200 p-4 md:p-5 flex items-start gap-4 hover:shadow-xs",
                      !notif.isRead
                        ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                        : "border-border/60 bg-card/60"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40",
                        style.iconBgClass,
                        style.iconColorClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wider",
                              style.badgeClass
                            )}
                          >
                            {style.badgeLabel}
                          </Badge>
                          <h3
                            className={cn(
                              "text-sm tracking-tight",
                              !notif.isRead
                                ? "font-bold text-foreground"
                                : "font-medium text-muted-foreground"
                            )}
                          >
                            {notif.title}
                          </h3>
                        </div>

                        <span className="text-xs text-muted-foreground font-mono">{timeStr}</span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/30">
                        <Link
                          href={targetUrl}
                          onClick={() => {
                            if (!notif.isRead) markAsRead(notif.id);
                          }}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>View Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>

                        <div className="flex items-center gap-1">
                          {!notif.isRead ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Mark Read</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsUnread(notif.id)}
                              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
                            >
                              <span className="h-2 w-2 rounded-full border border-current" />
                              <span>Mark Unread</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notif.id)}
                            className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Dismiss notification ${notif.title}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 self-center hidden sm:inline-block"
                        aria-label="Unread indicator"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <span className="text-xs text-muted-foreground font-mono">
                Page {page} of {totalPages} ({total} notices)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-xl text-xs h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl text-xs h-8 gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </ProtectedRoute>
  );
}
