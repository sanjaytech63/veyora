import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { NotificationBadge } from "../components/notifications/components/NotificationBadge";
import { NotificationHeader } from "../components/notifications/components/NotificationHeader";
import { NotificationListItem } from "../components/notifications/components/NotificationListItem";
import { NotificationEmptyState } from "../components/notifications/components/NotificationEmptyState";
import {
  resolveNotificationTargetUrl,
  getNotificationStyle,
  formatNotificationTime,
} from "../components/notifications/utils/notification-formatters";
import type { NotificationDto } from "../components/notifications/types/notification.types";

const mockNotification: NotificationDto = {
  id: "notif-123",
  userId: "user-456",
  title: "Order Dispatched",
  message: "Your royal Banarasi silk order #ORD-9988 has been dispatched via BlueDart.",
  type: "shipping",
  isRead: false,
  data: {
    orderId: "order-9988",
    orderNumber: "ORD-9988",
    trackingNumber: "BD-445566",
  },
  createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  updatedAt: new Date().toISOString(),
};

describe("NotificationBadge", () => {
  it("renders null when count is zero or negative", () => {
    const { container: c1 } = render(<NotificationBadge count={0} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<NotificationBadge count={-1} />);
    expect(c2.firstChild).toBeNull();
  });

  it("renders floating badge count correctly", () => {
    render(<NotificationBadge count={4} variant="floating" />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("caps count at 9+ and 99+", () => {
    const { rerender } = render(<NotificationBadge count={15} variant="floating" />);
    expect(screen.getByText("9+")).toBeInTheDocument();

    rerender(<NotificationBadge count={120} variant="floating" />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("renders inline badge variant with 'X new'", () => {
    render(<NotificationBadge count={6} variant="inline" />);
    expect(screen.getByText("6 new")).toBeInTheDocument();
  });
});

describe("NotificationHeader", () => {
  it("renders title and badge with unread count", () => {
    const onMarkAll = vi.fn();
    render(<NotificationHeader unreadCount={3} onMarkAllRead={onMarkAll} />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("3 new")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark all notifications as read/i })
    ).toBeInTheDocument();
  });

  it("hides mark all button when unread count is 0", () => {
    render(<NotificationHeader unreadCount={0} onMarkAllRead={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /mark all notifications as read/i })
    ).not.toBeInTheDocument();
  });

  it("triggers onMarkAllRead callback when clicked", () => {
    const onMarkAll = vi.fn();
    render(<NotificationHeader unreadCount={2} onMarkAllRead={onMarkAll} />);

    fireEvent.click(screen.getByRole("button", { name: /mark all notifications as read/i }));
    expect(onMarkAll).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationListItem", () => {
  it("renders notification details, badge, and formatted time", () => {
    render(<NotificationListItem notification={mockNotification} />);

    expect(screen.getByText("Order Dispatched")).toBeInTheDocument();
    expect(screen.getByText(/Your royal Banarasi silk order/i)).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText(/^\d{1,2} [A-Z][a-z]{2}$/)).toBeInTheDocument();
  });

  it("calls onMarkRead and onSelect when clicked if unread", () => {
    const onMarkRead = vi.fn();
    const onSelect = vi.fn();

    render(
      <NotificationListItem
        notification={mockNotification}
        onMarkRead={onMarkRead}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("article"));
    expect(onMarkRead).toHaveBeenCalledWith("notif-123");
    expect(onSelect).toHaveBeenCalledWith(mockNotification);
  });

  it("renders mark as unread and delete action buttons", () => {
    const onMarkUnread = vi.fn();
    const onDelete = vi.fn();

    const readNotification: NotificationDto = {
      ...mockNotification,
      isRead: true,
    };

    render(
      <NotificationListItem
        notification={readNotification}
        onMarkUnread={onMarkUnread}
        onDelete={onDelete}
      />
    );

    const markUnreadBtn = screen.getByRole("button", { name: /mark notification as unread/i });
    fireEvent.click(markUnreadBtn);
    expect(onMarkUnread).toHaveBeenCalledWith("notif-123");

    const deleteBtn = screen.getByRole("button", { name: /dismiss notification/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("notif-123");
  });
});

describe("NotificationEmptyState", () => {
  it("renders default empty state headline and description", () => {
    render(<NotificationEmptyState />);

    expect(screen.getByText("No notices right now")).toBeInTheDocument();
    expect(
      screen.getByText(/You will receive updates on your bespoke orders/i)
    ).toBeInTheDocument();
  });

  it("renders unread filter empty state headline", () => {
    render(<NotificationEmptyState filter="unread" />);

    expect(screen.getByText("No unread notices")).toBeInTheDocument();
    expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument();
  });
});

describe("Notification Formatters & Target URL Resolver", () => {
  it("resolves contextual URLs for order and shipping notifications", () => {
    const orderUrl = resolveNotificationTargetUrl({
      ...mockNotification,
      type: "order",
      data: { orderId: "ord-1122" },
    });
    expect(orderUrl).toBe("/orders/ord-1122");

    const trackUrl = resolveNotificationTargetUrl({
      ...mockNotification,
      type: "shipping",
      data: { trackingNumber: "TRACK9988" },
    });
    expect(trackUrl).toBe("/tracking?awb=TRACK9988");

    const accountUrl = resolveNotificationTargetUrl({
      ...mockNotification,
      type: "account",
      data: {},
    });
    expect(accountUrl).toBe("/profile");

    const defaultUrl = resolveNotificationTargetUrl({
      ...mockNotification,
      type: "system",
      data: {},
    });
    expect(defaultUrl).toBe("/account/notifications/notif-123");
  });

  it("returns styling and badges for notification types", () => {
    const shippingStyle = getNotificationStyle("shipping");
    expect(shippingStyle.badgeLabel).toBe("Shipping");

    const orderStyle = getNotificationStyle("order");
    expect(orderStyle.badgeLabel).toBe("Order");

    const paymentStyle = getNotificationStyle("payment");
    expect(paymentStyle.badgeLabel).toBe("Payment");

    const systemStyle = getNotificationStyle("system");
    expect(systemStyle.badgeLabel).toBe("Atelier");
  });

  it("formats timestamps as stable absolute dates", () => {
    const now = new Date();
    expect(formatNotificationTime(now.toISOString())).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/);

    const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    expect(formatNotificationTime(twoHoursAgo)).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/);

    const threeDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
    expect(formatNotificationTime(threeDaysAgo)).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/);
  });
});
