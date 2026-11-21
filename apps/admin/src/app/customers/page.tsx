"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  status: "active" | "inactive";
  joinedDate: string;
}

const CUSTOMERS: CustomerRecord[] = [
  {
    id: "CUST-001",
    name: "Aishwarya Sharma",
    email: "aishwarya.s@gmail.com",
    phone: "+91 98290 11463",
    city: "Jaipur, Rajasthan",
    ordersCount: 4,
    totalSpent: 845.0,
    status: "active",
    joinedDate: "Jan 12, 2026",
  },
  {
    id: "CUST-002",
    name: "Pooja Mehta",
    email: "pooja.mehta@yahoo.com",
    phone: "+91 98450 88219",
    city: "Mumbai, Maharashtra",
    ordersCount: 2,
    totalSpent: 640.0,
    status: "active",
    joinedDate: "Feb 03, 2026",
  },
  {
    id: "CUST-003",
    name: "Rohan Varma",
    email: "rohan.varma@outlook.com",
    phone: "+91 98801 32190",
    city: "Bengaluru, Karnataka",
    ordersCount: 3,
    totalSpent: 420.0,
    status: "active",
    joinedDate: "Feb 18, 2026",
  },
  {
    id: "CUST-004",
    name: "Sneha Kapur",
    email: "sneha.k@hotmail.com",
    phone: "+91 98110 54192",
    city: "New Delhi",
    ordersCount: 1,
    totalSpent: 380.0,
    status: "active",
    joinedDate: "Mar 01, 2026",
  },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = React.useState("");

  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Customer Management"
      description="View registered fashion patrons, purchase histories, and client concierge accounts."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Customers Refreshed")}
          className="gap-1.5 rounded-xl text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      }
    >
      <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or city..."
            className="pl-10 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Lifetime Spend</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-bold text-foreground">{c.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{c.id}</div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground">{c.email}</div>
                  <div className="text-[10px] text-muted-foreground/80">{c.phone}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.city}</TableCell>
                <TableCell className="font-bold tabular-nums">{c.ordersCount} orders</TableCell>
                <TableCell className="font-extrabold tabular-nums">${c.totalSpent.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-[11px]">{c.joinedDate}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold text-emerald-600 border-emerald-500/30">
                    {c.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
