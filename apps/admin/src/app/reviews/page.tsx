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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Trash2,
  ThumbsUp,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { adminReviewApi } from "@/lib/api/admin-review-api";
import { ReviewDto, AdminReviewStats, ReviewStatus } from "@veyora/types";
import { ApiClientError } from "@/lib/api/api-client";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<ReviewDto[]>([]);
  const [stats, setStats] = React.useState<AdminReviewStats>({
    totalReviews: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    averageRating: 0,
  });
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<"all" | ReviewStatus>("all");
  const [ratingFilter, setRatingFilter] = React.useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Rejection Dialog State
  const [rejectionModalOpen, setRejectionModalOpen] = React.useState(false);
  const [selectedReviewForReject, setSelectedReviewForReject] = React.useState<ReviewDto | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isModerating, setIsModerating] = React.useState(false);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadReviews = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminReviewApi.listReviews({
        page,
        limit: 15,
        status: statusFilter,
        rating: ratingFilter,
        search: debouncedSearch || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setReviews(response.reviews);
      setStats(response.stats);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to load reviews";
      toast.error("Error Loading Reviews", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, ratingFilter, debouncedSearch]);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Handle Quick Approval
  const handleApprove = async (review: ReviewDto) => {
    try {
      await adminReviewApi.moderateReview(review.id, { status: "approved" });
      toast.success("Review Approved", {
        description: `Feedback from ${review.customerName} is now published on the storefront.`,
      });
      loadReviews();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Approval failed";
      toast.error("Error Approving Review", { description: message });
    }
  };

  // Open Rejection Dialog
  const handleOpenRejectModal = (review: ReviewDto) => {
    setSelectedReviewForReject(review);
    setRejectionReason(review.rejectionReason || "Does not comply with community guidelines.");
    setRejectionModalOpen(true);
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!selectedReviewForReject) return;
    setIsModerating(true);
    try {
      await adminReviewApi.moderateReview(selectedReviewForReject.id, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      toast.warning("Review Rejected", {
        description: `Review flagged as rejected. Reason: "${rejectionReason.trim()}".`,
      });
      setRejectionModalOpen(false);
      setSelectedReviewForReject(null);
      loadReviews();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Rejection failed";
      toast.error("Error Rejecting Review", { description: message });
    } finally {
      setIsModerating(false);
    }
  };

  // Handle Delete
  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) {
      return;
    }
    try {
      await adminReviewApi.deleteReview(reviewId);
      toast.success("Review Deleted Permanently");
      loadReviews();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Deletion failed";
      toast.error("Could Not Delete Review", { description: message });
    }
  };

  return (
    <PageContainer
      title="Customer Reviews & Moderation"
      description="Audit, curate, and moderate verified buyer reviews, star ratings, and community fashion feedback."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadReviews()}
          disabled={isLoading}
          className="gap-1.5 rounded-xl text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Feedback</span>
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.totalReviews}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Submitted across catalog</p>
        </div>

        <div className={`rounded-2xl border bg-card p-4 shadow-sm ${stats.pendingCount > 0 ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-border/80"}`}>
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-500">Pending Queue</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {stats.pendingCount > 0 ? "Requires administrative audit" : "Queue fully cleared"}
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-600">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.approvedCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Publicly displayed on storefront</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-500">Rejected</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {stats.rejectedCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Flagged / Guideline violations</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-500">Avg Rating</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight flex items-baseline gap-1">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
            <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">From approved buyer ratings</p>
        </div>
      </div>

      {/* 2. Interactive Search & Filter Toolbar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Keyword Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patron, email, garment, or headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Rating Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-muted-foreground font-medium mr-1 hidden sm:inline">Stars:</span>
            {[
              { label: "All", val: undefined },
              { label: "5 ★", val: 5 },
              { label: "4 ★", val: 4 },
              { label: "3 ★", val: 3 },
              { label: "2 ★", val: 2 },
              { label: "1 ★", val: 1 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  setRatingFilter(opt.val);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  ratingFilter === opt.val
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
          {[
            { id: "all", label: "All Submissions", count: stats.totalReviews },
            { id: "pending", label: "Pending Audit", count: stats.pendingCount },
            { id: "approved", label: "Approved", count: stats.approvedCount },
            { id: "rejected", label: "Rejected", count: stats.rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as "all" | ReviewStatus);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                statusFilter === tab.id
                  ? "bg-foreground text-background font-semibold shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id
                    ? "bg-background/20 text-background"
                    : "bg-background text-muted-foreground border"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Review Management Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="text-xs bg-muted/30">
              <TableHead className="w-[200px]">Garment</TableHead>
              <TableHead className="w-[180px]">Patron</TableHead>
              <TableHead className="w-[110px]">Rating</TableHead>
              <TableHead className="min-w-[280px]">Review Feedback</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="text-right w-[150px]">Moderation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading feedback catalog...
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-sm text-foreground">No customer reviews found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No review submissions match your current search and filter criteria.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => {
                const dateStr = new Date(review.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <TableRow key={review.id} className="hover:bg-muted/30 transition-colors">
                    {/* Garment */}
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-1" title={review.productTitle}>
                        {review.productTitle || "Atelier Garment"}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        ID: {review.productId.slice(-8)}
                      </div>
                    </TableCell>

                    {/* Patron */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>{review.customerName}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{review.customerEmail}</div>
                      {review.isVerifiedPurchase && (
                        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-0.5">
                          <ShieldCheck className="h-3 w-3" />
                          Verified Buyer
                        </div>
                      )}
                    </TableCell>

                    {/* Rating */}
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted/60"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                        {review.rating}.0 / 5.0
                      </span>
                    </TableCell>

                    {/* Review Feedback */}
                    <TableCell>
                      <div className="font-semibold text-foreground mb-0.5 line-clamp-1">{review.title}</div>
                      <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                        {review.comment}
                      </p>
                      {review.helpfulCount > 0 && (
                        <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1">
                          <ThumbsUp className="h-2.5 w-2.5" />
                          <span>{review.helpfulCount} customer{review.helpfulCount > 1 ? "s" : ""} found this helpful</span>
                        </div>
                      )}
                      {review.status === "rejected" && review.rejectionReason && (
                        <div className="mt-1 text-[10px] text-rose-600 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md inline-flex">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Reason: {review.rejectionReason}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground font-mono text-[11px]">
                      {dateStr}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {review.status === "approved" && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Approved
                        </Badge>
                      )}
                      {review.status === "pending" && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold gap-1">
                          <Clock className="h-2.5 w-2.5" /> Pending
                        </Badge>
                      )}
                      {review.status === "rejected" && (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold gap-1">
                          <XCircle className="h-2.5 w-2.5" /> Rejected
                        </Badge>
                      )}
                    </TableCell>

                    {/* Moderation Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {review.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(review)}
                            className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg gap-1 border-emerald-200 dark:border-emerald-900"
                            title="Approve and publish to storefront"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                        )}
                        {review.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRejectModal(review)}
                            className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg gap-1 border-rose-200 dark:border-rose-900"
                            title="Reject and hide from storefront"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(review.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                          title="Delete review permanently"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/80 text-xs text-muted-foreground">
            <div>
              Showing page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span> ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="h-7 text-xs rounded-lg"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-7 text-xs rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Review Rejection Modal with Preset Guidelines */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-rose-600">
              <XCircle className="h-5 w-5" />
              Reject Review Submission
            </DialogTitle>
            <DialogDescription className="text-xs">
              State the justification for withholding this review from the public storefront.
            </DialogDescription>
          </DialogHeader>

          {selectedReviewForReject && (
            <div className="bg-muted/50 rounded-xl p-3 border border-border/60 text-xs space-y-1 mb-2">
              <div className="font-medium text-foreground">
                &ldquo;{selectedReviewForReject.title}&rdquo; ({selectedReviewForReject.rating} ★)
              </div>
              <div className="text-muted-foreground italic text-[11px] line-clamp-2">
                &ldquo;{selectedReviewForReject.comment}&rdquo;
              </div>
            </div>
          )}

          <div className="space-y-3 py-1">
            <div className="text-xs font-medium text-foreground">Preset Justifications:</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Profanity / Inappropriate content",
                "External promotional links or competitor advertising",
                "Spam or duplicate content",
                "Harassment / Disparaging remarks",
                "Irrelevant to the product",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-colors ${
                    rejectionReason === reason
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-600 font-medium"
                      : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-foreground">Custom Rejection Reason:</label>
              <Textarea
                placeholder="Provide internal reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectionModalOpen(false)}
              disabled={isModerating}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isModerating || !rejectionReason.trim()}
              className="text-xs gap-1.5"
            >
              {isModerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
