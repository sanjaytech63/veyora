"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/common/protected-route";
import {
  useNotificationDetail,
  useNotificationActions,
  getNotificationStyle,
  formatNotificationTime,
  resolveNotificationTargetUrl,
} from "@/components/notifications";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Package,
  Truck,
  ExternalLink,
  Trash2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NotificationDetailClientProps {
  notificationId: string;
}

export function NotificationDetailClient({ notificationId }: NotificationDetailClientProps) {
  const router = useRouter();
  const { data: notification, isLoading, isError, refetch } = useNotificationDetail(notificationId);
  const { markAsRead, markAsUnread, deleteNotificationAsync, isDeleting } =
    useNotificationActions();

  // Mark as read automatically when opening detail page if unread
  React.useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  const handleDelete = async () => {
    try {
      await deleteNotificationAsync(notificationId);
      router.push("/account/notifications");
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-10 md:py-16 bg-background">
        <Container size="lg" className="space-y-8">
          {/* Back link & Breadcrumbs */}
          <div className="flex items-center justify-between">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Link href="/account/notifications">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Notifications</span>
              </Link>
            </Button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/profile" className="hover:text-foreground transition-colors">
                Account
              </Link>
              <span>/</span>
              <Link
                href="/account/notifications"
                className="hover:text-foreground transition-colors"
              >
                Notifications
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {notification?.title || "Detail"}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-10 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : isError || !notification ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center space-y-4 max-w-md mx-auto my-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Notice Not Found</h3>
              <p className="text-xs text-muted-foreground">
                This notification does not exist or you do not have permission to access it.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </Button>
                <Button asChild variant="default" size="sm" className="rounded-xl text-xs">
                  <Link href="/account/notifications">Return to Notifications</Link>
                </Button>
              </div>
            </div>
          ) : (
            (() => {
              const style = getNotificationStyle(notification.type);
              const Icon = style.icon;
              const formattedDate = new Date(notification.createdAt).toLocaleDateString([], {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const timeAgo = formatNotificationTime(notification.createdAt);
              const metaData = (notification.data || {}) as Record<string, unknown>;
              const targetUrl = resolveNotificationTargetUrl(notification);

              return (
                <div className="rounded-3xl border border-border/80 bg-card/60 shadow-xl overflow-hidden divide-y divide-border/60">
                  {/* Header */}
                  <div className="p-6 md:p-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border border-border/40",
                            style.iconBgClass,
                            style.iconColorClass
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider",
                              style.badgeClass
                            )}
                          >
                            {style.badgeLabel}
                          </Badge>
                          <h1 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground mt-1">
                            {notification.title}
                          </h1>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {notification.isRead ? (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground border-border/60 text-xs px-2.5 py-1 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Read</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1"
                          >
                            Unread
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>({timeAgo})</span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="rounded-2xl bg-muted/30 p-5 md:p-6 border border-border/40">
                      <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-line">
                        {notification.message}
                      </p>
                    </div>

                    {/* Related Entity Context (Orders, Shipments, Account) */}
                    {Boolean(
                      metaData.orderNumber || metaData.orderId || metaData.trackingNumber
                    ) && (
                      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Related Atelier Reference
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            {Boolean(metaData.orderNumber || metaData.orderId) && (
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Package className="h-4 w-4 text-primary" />
                                <span>
                                  Order #{String(metaData.orderNumber || metaData.orderId)}
                                </span>
                              </div>
                            )}

                            {Boolean(metaData.trackingNumber) && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                <Truck className="h-3.5 w-3.5" />
                                <span>AWB Dispatch: {String(metaData.trackingNumber)}</span>
                              </div>
                            )}
                          </div>

                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="rounded-xl text-xs gap-1.5"
                          >
                            <Link href={targetUrl}>
                              <span>View Associated Record</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="p-6 md:p-8 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {!notification.isRead ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="rounded-xl text-xs h-9 gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Mark as Read</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => markAsUnread(notification.id)}
                          className="rounded-xl text-xs h-9 gap-1.5"
                        >
                          <span className="h-2 w-2 rounded-full border border-current" />
                          <span>Mark as Unread</span>
                        </Button>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-xl text-xs h-9 gap-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Notice</span>
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </Container>
      </div>
    </ProtectedRoute>
  );
}
