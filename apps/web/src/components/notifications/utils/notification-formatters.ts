import { ShoppingBag, CreditCard, Truck, User, Sparkles, LucideIcon } from "lucide-react";
import { NotificationType, NotificationDto } from "../types/notification.types";

export interface NotificationMetaStyle {
  icon: LucideIcon;
  badgeLabel: string;
  badgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

export function getNotificationStyle(type: NotificationType): NotificationMetaStyle {
  switch (type) {
    case "order":
      return {
        icon: ShoppingBag,
        badgeLabel: "Order",
        badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
        iconBgClass: "bg-blue-500/10",
        iconColorClass: "text-blue-600 dark:text-blue-400",
      };
    case "payment":
      return {
        icon: CreditCard,
        badgeLabel: "Payment",
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
        iconBgClass: "bg-emerald-500/10",
        iconColorClass: "text-emerald-600 dark:text-emerald-400",
      };
    case "shipping":
      return {
        icon: Truck,
        badgeLabel: "Shipping",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
        iconBgClass: "bg-amber-500/10",
        iconColorClass: "text-amber-600 dark:text-amber-400",
      };
    case "account":
      return {
        icon: User,
        badgeLabel: "Account",
        badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
        iconBgClass: "bg-purple-500/10",
        iconColorClass: "text-purple-600 dark:text-purple-400",
      };
    case "system":
    default:
      return {
        icon: Sparkles,
        badgeLabel: "Atelier",
        badgeClass: "bg-primary/10 text-primary border-primary/20",
        iconBgClass: "bg-primary/10",
        iconColorClass: "text-primary",
      };
  }
}

export function formatNotificationTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function resolveNotificationTargetUrl(notification: NotificationDto): string {
  if (notification.actionUrl && notification.actionUrl.trim().length > 0) {
    return notification.actionUrl;
  }

  const data = (notification.data || {}) as Record<string, unknown>;

  if (notification.type === "order" && (data.orderId || data.orderNumber)) {
    return `/orders/${data.orderId || data.orderNumber}`;
  }

  if (notification.type === "shipping" && (data.trackingNumber || data.orderId)) {
    return data.trackingNumber ? `/tracking?awb=${data.trackingNumber}` : `/orders/${data.orderId}`;
  }

  if (notification.type === "account") {
    return "/profile";
  }

  return `/account/notifications/${notification.id}`;
}
