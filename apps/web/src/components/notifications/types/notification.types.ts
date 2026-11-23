import {
  NotificationDto,
  NotificationType,
  NotificationListQuery,
  PaginatedNotificationsDto,
} from "@veyora/types";

export type { NotificationDto, NotificationType, NotificationListQuery, PaginatedNotificationsDto };

export type NotificationItem = NotificationDto;

export type NotificationFilter = "all" | "unread" | "read";

export interface NotificationPopoverProps {
  align?: "start" | "center" | "end";
  className?: string;
}

export interface NotificationListItemProps {
  notification: NotificationDto;
  onSelect?: (notification: NotificationDto) => void;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}
