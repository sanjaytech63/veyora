"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  productTitle: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  status: "approved" | "pending" | "rejected";
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "REV-01",
    productTitle: "Chanderi Silk Kurti Set with Organza Dupatta",
    customerName: "Aishwarya S.",
    rating: 5,
    comment:
      "Absolutely regal fabric! The gota patti embroidery on the cuffs is stunning and the organza dupatta falls gracefully.",
    date: "Yesterday",
    status: "approved",
  },
  {
    id: "REV-02",
    productTitle: "Bandhani Silk Festive Lehenga Choli",
    customerName: "Pooja M.",
    rating: 5,
    comment:
      "Wore this to my sister's Sangeet ceremony. Received endless compliments on the authentic Rajasthani Bandhani work.",
    date: "2 days ago",
    status: "approved",
  },
  {
    id: "REV-03",
    productTitle: "Pure Mulmul Cotton Hand-Block Print Kurti",
    customerName: "Radhika K.",
    rating: 4,
    comment:
      "Very soft mulmul cotton and authentic vegetable dyes. Perfect for warm summer afternoons.",
    date: "3 days ago",
    status: "pending",
  },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<ReviewItem[]>(INITIAL_REVIEWS);

  const handleStatusChange = (id: string, newStatus: ReviewItem["status"]) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    toast.success(`Review ${newStatus}`);
  };

  return (
    <PageContainer
      title="Customer Reviews &amp; Moderation"
      description="Moderate customer product ratings, feedback testimonials, and verified buyer reviews."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Reviews Refreshed")}
          className="gap-1.5 rounded-xl text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      }
    >
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Garment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-[400px]">Review Feedback</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Moderation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {reviews.map((rev) => (
              <TableRow key={rev.id}>
                <TableCell className="font-semibold text-foreground max-w-[200px] truncate">
                  {rev.productTitle}
                </TableCell>
                <TableCell>{rev.customerName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < rev.rating ? "fill-current" : "opacity-30"}`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px]">{rev.date}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      rev.status === "approved"
                        ? "default"
                        : rev.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px] uppercase font-semibold"
                  >
                    {rev.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {rev.status !== "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(rev.id, "approved")}
                      className="h-8 rounded-lg text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      Approve
                    </Button>
                  )}
                  {rev.status !== "rejected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(rev.id, "rejected")}
                      className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                    >
                      Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
