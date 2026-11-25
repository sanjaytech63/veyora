import type { Metadata } from "next";
import { InventoryListClient } from "./inventory-list-client";

export const metadata: Metadata = {
  title: "Inventory Matrix",
  description: "Real-time stock balances, warehouse reservations, and low-stock replenishment.",
};

export default function AdminInventoryPage() {
  return <InventoryListClient />;
}
