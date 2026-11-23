"use client";

import { NotificationPopover } from "./components/NotificationPopover";

export function NotificationBell({ className }: { className?: string }) {
  return <NotificationPopover className={className} />;
}
