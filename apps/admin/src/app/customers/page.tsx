import type { Metadata } from "next";
import { CustomersListClient } from "./customers-list-client";

export const metadata: Metadata = {
  title: "Patron Registry",
  description: "Customer directories, acquisition cohorts, lifetime value, and order history.",
};

export default function AdminCustomersPage() {
  return <CustomersListClient />;
}
