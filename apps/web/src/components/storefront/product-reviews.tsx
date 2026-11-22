"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Star, ShieldCheck, ThumbsUp, MessageSquare, PenLine, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { reviewApi } from "@/lib/api/review-api";
import { useAuthStore } from "@/stores/auth-store";
import { ReviewDto, ProductRatingSummary } from "@veyora/types";
import { ApiClientError } from "@/lib/api/api-client";

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor — Disappointing fabric or fit",
  2: "Fair — Below expectations",
  3: "Good — Meets basic expectations",
  4: "Very Good — High quality & elegant",
  5: "Exceptional — Atelier masterpiece",
};

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = React.useState<ReviewDto[]>([]);
  const [summary, setSummary] = React.useState<ProductRatingSummary>({
    productId,
    averageRating: 0,
    reviewCount: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [selectedRatingFilter, setSelectedRatingFilter] = React.useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<"newest" | "highest" | "lowest" | "most_helpful">("newest");
  const [isLoading, setIsLoading] = React.useState(true);

  // Submission Dialog State
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [authPromptOpen, setAuthPromptOpen] = React.useState(false);
  const [ratingInput, setRatingInput] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [titleInput, setTitleInput] = React.useState("");
  const [commentInput, setCommentInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Helpful votes tracking set
  const [votedReviews, setVotedReviews] = React.useState<Set<string>>(new Set());

  // Fetch Reviews
  const fetchReviews = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await reviewApi.getProductReviews(productId, {
        page,
        limit: 8,
        rating: selectedRatingFilter,
        sort: sortBy,
      });
      setReviews(response.reviews);
      if (response.summary) {
        setSummary(response.summary);
      }
      setTotalPages(response.pagination.totalPages);
    } catch {
      // Silently handle error or keep empty state
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, selectedRatingFilter, sortBy]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Open Write Review Modal
  const handleOpenWriteReview = () => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    setRatingInput(5);
    setTitleInput("");
    setCommentInput("");
    setReviewModalOpen(true);
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || titleInput.trim().length < 2) {
      toast.error("Please provide a review headline (minimum 2 characters).");
      return;
    }
    if (!commentInput.trim() || commentInput.trim().length < 5) {
      toast.error("Please provide a detailed review comment (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewApi.submitReview(productId, {
        rating: ratingInput,
        title: titleInput.trim(),
        comment: commentInput.trim(),
      });

      toast.success("Review Submitted for Curation", {
        description: "Thank you for sharing your experience! Your review will be published upon curation.",
      });

      setReviewModalOpen(false);
      setTitleInput("");
      setCommentInput("");
      fetchReviews();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Unable to submit review";
      toast.error("Submission Failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Vote Helpful
  const handleMarkHelpful = async (reviewId: string) => {
    if (votedReviews.has(reviewId)) {
      toast.info("You have already voted on this review.");
      return;
    }

    try {
      const res = await reviewApi.markHelpful(reviewId);
      setVotedReviews((prev) => new Set(prev).add(reviewId));
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount } : r))
      );
      toast.success("Thank you for your feedback!");
    } catch {
      toast.error("Could not record vote.");
    }
  };

  const totalReviews = summary.reviewCount || 0;
  const averageScore = summary.averageRating || 0;

  return (
    <section id="reviews-section" className="py-12 border-t border-border/80">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
              Testimonials &amp; Feedback
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              Client Experiences &amp; Reviews
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Authentic reflections from clients who own and cherish our handcrafted silhouettes.
            </p>
          </div>

          <Button
            onClick={handleOpenWriteReview}
            className="rounded-full px-6 py-2 text-xs font-semibold gap-2 shadow-sm self-start md:self-auto"
          >
            <PenLine className="h-4 w-4" />
            Write a Review
          </Button>
        </div>

        {/* Rating Breakdown Card & Breakdown Bars */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-sm">
          {/* Big Score Summary */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-border/60">
            <div className="text-5xl sm:text-6xl font-serif font-bold tracking-tight text-foreground">
              {averageScore > 0 ? averageScore.toFixed(1) : "0.0"}
            </div>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageScore)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted/60"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Based on{" "}
              <span className="font-semibold text-foreground">{totalReviews}</span> client rating
              {totalReviews === 1 ? "" : "s"}
            </div>
            {totalReviews > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                98% Client Satisfaction Rate
              </div>
            )}
          </div>

          {/* Star Rating Breakdown Bars */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2.5 px-0 sm:px-4">
            {[5, 4, 3, 2, 1].map((starKey) => {
              const count = summary.breakdown[starKey as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              const isSelected = selectedRatingFilter === starKey;

              return (
                <button
                  key={starKey}
                  type="button"
                  onClick={() => {
                    setSelectedRatingFilter(isSelected ? undefined : starKey);
                    setPage(1);
                  }}
                  className={`group flex items-center gap-3 text-xs w-full py-1 px-2 rounded-xl transition-colors ${
                    isSelected ? "bg-muted font-semibold" : "hover:bg-muted/40"
                  }`}
                >
                  <span className="w-12 text-left font-medium text-foreground flex items-center gap-1">
                    {starKey} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                  </span>

                  <div className="flex-1 h-2 rounded-full bg-muted/80 overflow-hidden relative">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="w-16 text-right font-mono text-muted-foreground text-[11px]">
                    {count} ({percent}%)
                  </span>
                </button>
              );
            })}

            {selectedRatingFilter && (
              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Filtering by {selectedRatingFilter} Star reviews</span>
                <button
                  onClick={() => {
                    setSelectedRatingFilter(undefined);
                    setPage(1);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Sorting Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-muted-foreground font-medium mr-1">Sort:</span>
            {[
              { id: "newest", label: "Most Recent" },
              { id: "highest", label: "Highest Rated" },
              { id: "lowest", label: "Lowest Rated" },
              { id: "most_helpful", label: "Most Helpful" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSortBy(option.id as "newest" | "highest" | "lowest" | "most_helpful");
                  setPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  sortBy === option.id
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {reviews.length} of {totalReviews} approved review{totalReviews === 1 ? "" : "s"}
          </div>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
            <p className="text-xs font-medium">Curating verified client feedback...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border/80 bg-muted/20">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-serif font-semibold text-foreground">
              {selectedRatingFilter
                ? `No ${selectedRatingFilter}-star reviews found`
                : "No reviews published yet"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              {selectedRatingFilter
                ? "Try clearing your star rating filter to view all community feedback."
                : `Be the very first patron to review ${productTitle} and share your styling notes.`}
            </p>
            <Button
              onClick={handleOpenWriteReview}
              variant="outline"
              size="sm"
              className="mt-4 rounded-full text-xs gap-1.5"
            >
              <PenLine className="h-3.5 w-3.5" />
              Write First Review
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const formattedDate = new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              // Initials avatar
              const initials = review.customerName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "VC";

              return (
                <div
                  key={review.id}
                  className="p-6 rounded-2xl border border-border/70 bg-card hover:border-border transition-colors space-y-3"
                >
                  {/* Top Bar: Patron Profile & Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-serif font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-foreground">
                            {review.customerName}
                          </span>
                          {review.isVerifiedPurchase && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-medium py-0 px-1.5 gap-0.5"
                            >
                              <ShieldCheck className="h-3 w-3" /> Verified Buyer
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {formattedDate}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex items-center gap-1 self-start sm:self-auto">
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
                  </div>

                  {/* Review Content */}
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-sm font-semibold text-foreground tracking-tight">
                      {review.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {review.comment}
                    </p>
                  </div>

                  {/* Helpful Vote Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-border/40">
                    <button
                      onClick={() => handleMarkHelpful(review.id)}
                      disabled={votedReviews.has(review.id)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                        votedReviews.has(review.id)
                          ? "text-primary cursor-default"
                          : "text-muted-foreground hover:text-foreground cursor-pointer"
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>
                        Helpful ({review.helpfulCount || 0})
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="text-xs rounded-full h-8 px-4"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="text-xs rounded-full h-8 px-4"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Write a Review Submission Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitReview}>
            <DialogHeader>
              <DialogTitle className="text-lg font-serif font-bold text-foreground">
                Write a Product Review
              </DialogTitle>
              <DialogDescription className="text-xs">
                Reviewing <span className="font-semibold text-foreground">{productTitle}</span>. Your perspective assists patrons across our collective atelier.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Star Rating Interactive Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeRating = hoverRating || ratingInput;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-md transition-transform hover:scale-115 focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= activeRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium italic">
                  {RATING_LABELS[hoverRating || ratingInput]}
                </div>
              </div>

              {/* Review Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Headline / Title *
                </label>
                <Input
                  placeholder="e.g. Breathtaking silk drape &amp; flawless embroidery"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  maxLength={100}
                  className="text-xs rounded-xl"
                  disabled={isSubmitting}
                />
              </div>

              {/* Review Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Detailed Experience &amp; Notes *
                </label>
                <Textarea
                  placeholder="Share details regarding the fabric breathability, silhouette fit, festive styling, and craftsmanship..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="text-xs rounded-xl"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Minimum 5 characters</span>
                  <span>{commentInput.length} / 2000</span>
                </div>
              </div>

              {/* Note on Verified Buyer Badge */}
              <div className="rounded-xl p-3 bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Patrons with a delivered order will automatically receive an exclusive <strong className="text-foreground">Verified Buyer</strong> badge.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !titleInput.trim() || !commentInput.trim()}
                className="text-xs rounded-full gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Curation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Authentication Prompt Modal for Unauthenticated Users */}
      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-foreground">
              Sign In to Review Garments
            </DialogTitle>
            <DialogDescription className="text-xs">
              To ensure all testimonials reflect authentic client experiences, please sign in to your Veyora account.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted-foreground">
            Once signed in, you will be able to share your feedback and join our community of fashion connoisseurs.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuthPromptOpen(false)}
              className="text-xs rounded-full"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setAuthPromptOpen(false);
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
              }}
              className="text-xs rounded-full"
            >
              Sign In Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
