"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  RefreshCw,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  TrendingUp,
  BarChart2,
  Calendar,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { adminCouponsApi } from "@/lib/api/admin-coupons-api";
import {
  CouponDto,
  CouponStatus,
  DiscountType,
  CouponAnalyticsDto,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "@veyora/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<CouponDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [totalCoupons, setTotalCoupons] = React.useState(0);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Form State
  const [selectedCoupon, setSelectedCoupon] = React.useState<CouponDto | null>(null);
  const [analyticsData, setAnalyticsData] = React.useState<CouponAnalyticsDto | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Form inputs
  const [formCode, setFormCode] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formDiscountType, setFormDiscountType] = React.useState<DiscountType>("percentage");
  const [formDiscountValue, setFormDiscountValue] = React.useState<number>(10);
  const [formMinOrderAmount, setFormMinOrderAmount] = React.useState<number>(100);
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = React.useState<string>("");
  const [formStartDate, setFormStartDate] = React.useState<string>("");
  const [formEndDate, setFormEndDate] = React.useState<string>("");
  const [formUsageLimit, setFormUsageLimit] = React.useState<string>("");
  const [formPerCustomerLimit, setFormPerCustomerLimit] = React.useState<number>(1);
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);

  // Fetch Coupons
  const fetchCoupons = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminCouponsApi.listCoupons({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? (statusFilter as CouponStatus) : undefined,
        limit: 50,
      });
      setCoupons(response.items);
      setTotalCoupons(response.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load coupons";
      toast.error("Error loading coupons", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Handle Status Toggle
  const handleToggleStatus = async (coupon: CouponDto) => {
    try {
      const updated = await adminCouponsApi.toggleCouponStatus(coupon.id);
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(`Coupon ${updated.code} is now ${updated.isActive ? "Active" : "Inactive"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle status";
      toast.error("Status update failed", { description: msg });
    }
  };

  // Open Create Dialog
  const openCreateDialog = () => {
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("percentage");
    setFormDiscountValue(10);
    setFormMinOrderAmount(100);
    setFormMaxDiscountAmount("");
    setFormStartDate("");
    setFormEndDate("");
    setFormUsageLimit("");
    setFormPerCustomerLimit(1);
    setFormIsActive(true);
    setCreateDialogOpen(true);
  };

  // Handle Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    setActionLoading(true);
    try {
      const payload: CreateCouponPayload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        minimumOrderAmount: Number(formMinOrderAmount) || 0,
        maxDiscountAmount: formMaxDiscountAmount ? Number(formMaxDiscountAmount) : undefined,
        startsAt: formStartDate ? new Date(formStartDate).toISOString() : undefined,
        expiresAt: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : undefined,
        perCustomerLimit: Number(formPerCustomerLimit) || 1,
        isActive: formIsActive,
      };

      const created = await adminCouponsApi.createCoupon(payload);
      setCoupons((prev) => [created, ...prev]);
      setTotalCoupons((prev) => prev + 1);
      toast.success("Privilege Code Created", {
        description: `Code ${created.code} is registered successfully.`,
      });
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create coupon";
      toast.error("Creation failed", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Dialog
  const openEditDialog = (coupon: CouponDto) => {
    setSelectedCoupon(coupon);
    setFormDescription(coupon.description || "");
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue);
    setFormMinOrderAmount(coupon.minimumOrderAmount || 0);
    setFormMaxDiscountAmount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "");
    setFormStartDate(coupon.startsAt ? (coupon.startsAt.split("T")[0] ?? "") : "");
    setFormEndDate(coupon.expiresAt ? (coupon.expiresAt.split("T")[0] ?? "") : "");
    setFormUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : "");
    setFormPerCustomerLimit(coupon.perCustomerLimit || 1);
    setFormIsActive(coupon.isActive);
    setEditDialogOpen(true);
  };

  // Handle Update Coupon
  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoupon) return;

    setActionLoading(true);
    try {
      const payload: UpdateCouponPayload = {
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        minimumOrderAmount: Number(formMinOrderAmount) || 0,
        maxDiscountAmount: formMaxDiscountAmount ? Number(formMaxDiscountAmount) : undefined,
        startsAt: formStartDate ? new Date(formStartDate).toISOString() : undefined,
        expiresAt: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : undefined,
        perCustomerLimit: Number(formPerCustomerLimit) || 1,
        isActive: formIsActive,
      };

      const updated = await adminCouponsApi.updateCoupon(selectedCoupon.id, payload);
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Privilege Code Updated", {
        description: `Changes to ${updated.code} have been saved.`,
      });
      setEditDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update coupon";
      toast.error("Update failed", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Analytics Dialog
  const openAnalytics = async (coupon: CouponDto) => {
    setSelectedCoupon(coupon);
    setAnalyticsDialogOpen(true);
    setAnalyticsLoading(true);
    try {
      const data = await adminCouponsApi.getCouponAnalytics(coupon.id);
      setAnalyticsData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytics";
      toast.error("Analytics error", { description: msg });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Open Delete Dialog
  const openDeleteDialog = (coupon: CouponDto) => {
    setSelectedCoupon(coupon);
    setDeleteDialogOpen(true);
  };

  // Handle Delete Coupon
  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;
    setActionLoading(true);
    try {
      await adminCouponsApi.deleteCoupon(selectedCoupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== selectedCoupon.id));
      setTotalCoupons((prev) => Math.max(0, prev - 1));
      toast.success("Coupon Deleted", {
        description: `Privilege code ${selectedCoupon.code} has been purged.`,
      });
      setDeleteDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete coupon";
      toast.error("Deletion failed", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Aggregate KPI metrics
  const activeCount = coupons.filter((c) => c.status === "active").length;
  const totalUses = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);
  const totalDiscountDistributed = coupons.reduce(
    (acc, c) => acc + (c.analytics?.totalDiscountGiven || 0),
    0
  );

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground md:text-3xl">
                Promotions & Privilege Codes
              </h1>
              <Badge variant="secondary" className="font-mono text-xs tracking-wider">
                PHASE L
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Configure promotional campaigns, discount thresholds, and client privilege codes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCoupons}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="gap-2 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              New Privilege Code
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Codes
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{totalCoupons}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured privilege codes</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Campaigns
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for checkout redemption</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Redemptions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{totalUses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total orders redeemed</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Discount Conceded
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                ${totalDiscountDistributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In customer savings granted</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-lg border border-border/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="rounded-md border border-border/40 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[180px]">Code</TableHead>
                <TableHead>Type & Benefit</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Usage / Limit</TableHead>
                <TableHead>Validity Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                    Querying privilege records...
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No privilege codes found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => {
                  const isPercentage = coupon.discountType === "percentage";
                  const isExpired = coupon.status === "expired";

                  return (
                    <TableRow key={coupon.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold tracking-wider text-primary">
                            {coupon.code}
                          </span>
                          {coupon.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                              {coupon.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {isPercentage ? (
                            <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
                              <Percent className="h-3 w-3" />
                              {coupon.discountValue}% OFF
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                              <DollarSign className="h-3 w-3" />
                              ${coupon.discountValue} OFF
                            </Badge>
                          )}
                          {isPercentage && coupon.maxDiscountAmount && (
                            <span className="text-xs text-muted-foreground">
                              (Max ${coupon.maxDiscountAmount})
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          {coupon.minimumOrderAmount > 0 ? (
                            <span>Min spend: ${coupon.minimumOrderAmount}</span>
                          ) : (
                            <span>No minimum</span>
                          )}
                          {coupon.perCustomerLimit && (
                            <span>Limit {coupon.perCustomerLimit}/client</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">
                            {coupon.usageCount}{" "}
                            {coupon.usageLimit ? `/ ${coupon.usageLimit}` : "uses (unlimited)"}
                          </span>
                          {coupon.usageLimit && (
                            <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-primary h-full"
                                style={{
                                  width: `${Math.min(100, ((coupon.usageCount || 0) / coupon.usageLimit) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          {coupon.expiresAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Until {new Date(coupon.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Permanent
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.isActive && !isExpired}
                            disabled={isExpired}
                            onCheckedChange={() => handleToggleStatus(coupon)}
                          />
                          {coupon.status === "active" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                              Active
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel className="text-xs">Management</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openAnalytics(coupon)} className="gap-2">
                              <BarChart2 className="h-4 w-4" /> Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(coupon)} className="gap-2">
                              <Edit className="h-4 w-4" /> Edit Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(coupon)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CREATE COUPON DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateCoupon}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Issue New Privilege Code</DialogTitle>
              <DialogDescription>
                Configure server-enforced promotional terms, customer spend requirements, and usage quotas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Privilege Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g. ATELIER20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase tracking-wider"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={formDiscountType}
                    onValueChange={(val) => setFormDiscountType(val as DiscountType)}
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Discount (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Deduction ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Campaign Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. VIP Festive Private Invitation 2026"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discountValue">
                    {formDiscountType === "percentage" ? "Percentage (% off)" : "Fixed Amount ($ off)"} *
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="1"
                    max={formDiscountType === "percentage" ? "100" : undefined}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minOrderAmount">Minimum Spend Requirement ($)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    value={formMinOrderAmount}
                    onChange={(e) => setFormMinOrderAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              {formDiscountType === "percentage" && (
                <div className="space-y-1.5">
                  <Label htmlFor="maxDiscountAmount">Maximum Discount Cap ($) (Optional)</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min="1"
                    placeholder="e.g. 50 (leaves uncapped if blank)"
                    value={formMaxDiscountAmount}
                    onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="usageLimit">Global Usage Limit (Optional)</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="Unlimited if left empty"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="perCustomerLimit">Per-Customer Redemption Limit</Label>
                  <Input
                    id="perCustomerLimit"
                    type="number"
                    min="1"
                    value={formPerCustomerLimit}
                    onChange={(e) => setFormPerCustomerLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Expiration Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Activate Immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable this promotion for immediate customer checkout redemption.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="gap-2">
                {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Register Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT COUPON DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateCoupon}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                Edit Privilege Code: {selectedCoupon?.code}
              </DialogTitle>
              <DialogDescription>
                Modify active rules, spend caps, and expiry dates. Code identifier cannot be altered once issued.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="editDescription">Campaign Description</Label>
                <Input
                  id="editDescription"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editDiscountType">Discount Type</Label>
                  <Select
                    value={formDiscountType}
                    onValueChange={(val) => setFormDiscountType(val as DiscountType)}
                  >
                    <SelectTrigger id="editDiscountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editDiscountValue">Discount Value *</Label>
                  <Input
                    id="editDiscountValue"
                    type="number"
                    min="1"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editMinOrderAmount">Minimum Spend ($)</Label>
                  <Input
                    id="editMinOrderAmount"
                    type="number"
                    min="0"
                    value={formMinOrderAmount}
                    onChange={(e) => setFormMinOrderAmount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editMaxDiscountAmount">Max Discount Cap ($)</Label>
                  <Input
                    id="editMaxDiscountAmount"
                    type="number"
                    min="1"
                    placeholder="Uncapped"
                    value={formMaxDiscountAmount}
                    onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editUsageLimit">Global Usage Limit</Label>
                  <Input
                    id="editUsageLimit"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editPerCustomerLimit">Per-Customer Limit</Label>
                  <Input
                    id="editPerCustomerLimit"
                    type="number"
                    min="1"
                    value={formPerCustomerLimit}
                    onChange={(e) => setFormPerCustomerLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editEndDate">Expiry Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="space-y-0.5">
                  <Label htmlFor="editIsActive">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Control whether this code can currently be redeemed.
                  </p>
                </div>
                <Switch
                  id="editIsActive"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="gap-2">
                {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ANALYTICS & REDEMPTIONS DIALOG */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Campaign Performance: {selectedCoupon?.code}
            </DialogTitle>
            <DialogDescription>
              Real-time audit log and financial attribution for this promotional privilege.
            </DialogDescription>
          </DialogHeader>

          {analyticsLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
              Aggregating redemption ledgers...
            </div>
          ) : analyticsData ? (
            <div className="space-y-6 py-2">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-center">
                  <span className="text-xs text-muted-foreground">Total Uses</span>
                  <div className="text-xl font-bold font-serif mt-0.5">
                    {analyticsData.usageCount}
                  </div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-center">
                  <span className="text-xs text-muted-foreground">Usage Limit</span>
                  <div className="text-xl font-bold font-serif mt-0.5">
                    {analyticsData.usageLimit ? analyticsData.usageLimit : "∞"}
                  </div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-center">
                  <span className="text-xs text-muted-foreground">Discount Awarded</span>
                  <div className="text-xl font-bold font-serif mt-0.5 text-emerald-600 dark:text-emerald-400">
                    ${analyticsData.totalDiscountGiven.toFixed(2)}
                  </div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-center">
                  <span className="text-xs text-muted-foreground">Revenue Driven</span>
                  <div className="text-xl font-bold font-serif mt-0.5">
                    ${analyticsData.totalRevenueGenerated.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Redemption Audit Log */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Recent Redemptions Log ({analyticsData.recentRedemptions.length})
                </h4>
                {analyticsData.recentRedemptions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground border border-border/40 rounded-md text-xs">
                    No orders have redeemed this code yet.
                  </div>
                ) : (
                  <div className="rounded-md border border-border/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-xs">Order</TableHead>
                          <TableHead className="text-xs">Client Email</TableHead>
                          <TableHead className="text-xs">Discount</TableHead>
                          <TableHead className="text-xs">Order Total</TableHead>
                          <TableHead className="text-xs text-right">Redeemed At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData.recentRedemptions.map((redemption, idx) => (
                          <TableRow key={`${redemption.orderId}-${idx}`} className="text-xs">
                            <TableCell className="font-mono font-medium">
                              {redemption.orderNumber}
                            </TableCell>
                            <TableCell>{redemption.customerEmail || "Guest Patron"}</TableCell>
                            <TableCell className="text-emerald-600 font-medium">
                              -${redemption.discountAmount.toFixed(2)}
                            </TableCell>
                            <TableCell>${redemption.orderTotal.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {new Date(redemption.appliedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground text-sm">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
              Unable to aggregate analytics for this code.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Purge Privilege Code</DialogTitle>
            <DialogDescription>
              Are you certain you wish to delete{" "}
              <span className="font-mono font-semibold text-foreground">
                {selectedCoupon?.code}
              </span>
              ? This action cannot be reversed and future checkout attempts with this code will fail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCoupon}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
