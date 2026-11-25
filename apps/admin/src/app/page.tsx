import type { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Executive Dashboard",
  description: "Real-time administrative operations, revenue analytics, and atelier KPIs.",
};

export default function AdminHomePage() {
  return <DashboardClient />;
}
