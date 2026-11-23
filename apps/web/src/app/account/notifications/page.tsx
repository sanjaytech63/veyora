import type { Metadata } from "next";
import { NotificationsCenterClient } from "./notifications-center-client";

export const metadata: Metadata = {
  title: "Atelier Notifications | Veyora",
  description: "Manage your personalized order notices, concierge dispatches, and private drops.",
};

export default function NotificationsCenterPage() {
  return <NotificationsCenterClient />;
}
