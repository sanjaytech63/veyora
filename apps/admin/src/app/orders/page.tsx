import type { Metadata } from "next";
import { OrdersListClient } from "./orders-list-client";

export const metadata: Metadata = {
  title: "Order Fulfillment Ledger",
  description: "Customer purchases, dispatch tracking, shipment manifests, and payment statuses.",
};

export default function AdminOrdersPage() {
  return <OrdersListClient />;
}
