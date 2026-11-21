"use client";

import * as React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Search,
  RefreshCw,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { adminCustomersApi } from "@/lib/api/admin-customers-api";
import { CustomerDto } from "@veyora/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // Status Change Dialog State
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [targetCustomer, setTargetCustomer] = React.useState<CustomerDto | null>(null);
  const [newStatus, setNewStatus] = React.useState<boolean>(true);
  const [statusReason, setStatusReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Notes Dialog State
  const [notesDialogOpen, setNotesDialogOpen] = React.useState(false);
  const [customerNotes, setCustomerNotes] = React.useState("");

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminCustomersApi.listCustomers({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? (statusFilter as "active" | "inactive") : undefined,
        page,
        limit: 15,
      });
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load customers";
      toast.error("Error loading patrons", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle Opening Status Dialog
  const openStatusDialog = (customer: CustomerDto, targetActiveState: boolean) => {
    setTargetCustomer(customer);
    setNewStatus(targetActiveState);
    setStatusReason(customer.statusReason || "");
    setStatusDialogOpen(true);
  };

  // Submit Status Change
  const handleUpdateStatus = async () => {
    if (!targetCustomer) return;
    setActionLoading(true);
    try {
      const updated = await adminCustomersApi.updateCustomerStatus(targetCustomer.id, {
        isActive: newStatus,
        reason: statusReason.trim() || undefined,
      });

      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(
        `Patron account ${updated.isActive ? "activated" : "suspended"}`,
        { description: `Status for ${updated.fullName} was updated.` }
      );
      setStatusDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error("Status update error", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Opening Notes Dialog
  const openNotesDialog = (customer: CustomerDto) => {
    setTargetCustomer(customer);
    setCustomerNotes(customer.notes || "");
    setNotesDialogOpen(true);
  };

  // Submit Notes
  const handleUpdateNotes = async () => {
    if (!targetCustomer) return;
    setActionLoading(true);
    try {
      const updated = await adminCustomersApi.updateCustomerNotes(targetCustomer.id, {
        notes: customerNotes.trim(),
      });

      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Dossier Updated", {
        description: `Internal notes for ${updated.fullName} have been saved.`,
      });
      setNotesDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update notes";
      toast.error("Note save error", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Aggregate Metrics
  const activeCount = customers.filter((c) => c.isActive).length;
  const cumulativeSpend = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((acc, c) => acc + (c.ordersCount || 0), 0);
  const avgOrderVal = totalOrders > 0 ? cumulativeSpend / totalOrders : 0;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground md:text-3xl">
                Patron Management
              </h1>
              <Badge variant="secondary" className="font-mono text-xs tracking-wider">
                PHASE M
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Oversee registered fashion patrons, VIP couture clients, purchase records, and account statuses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCustomers}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Metrics Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Patrons
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{totalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered clients in directory</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Clients
              </CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In active standing</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cumulative Spend
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                ${cumulativeSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all patron orders</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xs bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Average Lifetime Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                ${avgOrderVal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average order value</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-lg border border-border/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patron name, email, or telephone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="rounded-md border border-border/40 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[220px]">Patron</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Standing</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                    Consulting patron directory...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No patrons found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-serif font-medium text-foreground hover:text-primary transition-colors hover:underline"
                        >
                          {customer.fullName || `${customer.firstName} ${customer.lastName}`}
                        </Link>
                        {customer.totalSpent > 1000 && (
                          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                            VIP Couture
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{customer.email}</span>
                        {customer.phone && <span className="font-mono">{customer.phone}</span>}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={customer.isActive}
                          onCheckedChange={(checked) => openStatusDialog(customer, checked)}
                        />
                        {customer.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            Suspended
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {customer.isEmailVerified ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5 text-amber-500" />
                          <span>Pending</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{customer.ordersCount}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-serif font-semibold text-sm">
                      ${customer.totalSpent.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs">Client Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.id}`} className="gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" /> View Dossier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openNotesDialog(customer)} className="gap-2">
                            <FileText className="h-4 w-4" /> Edit Notes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openStatusDialog(customer, !customer.isActive)}
                            className={`gap-2 ${
                              customer.isActive
                                ? "text-destructive focus:text-destructive"
                                : "text-emerald-600 focus:text-emerald-600"
                            }`}
                          >
                            {customer.isActive ? (
                              <>
                                <AlertTriangle className="h-4 w-4" /> Suspend Account
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" /> Re-activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/40 text-xs text-muted-foreground">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total patrons)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2 gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2 gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATUS CHANGE DIALOG */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              {newStatus ? "Re-activate Patron Account" : "Suspend Patron Account"}
            </DialogTitle>
            <DialogDescription>
              {newStatus
                ? `Restore checkout and login privileges for ${targetCustomer?.fullName}.`
                : `Temporarily restrict ${targetCustomer?.fullName} from placing new orders or logging in.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="statusReason">Reason for Status Change</Label>
            <Textarea
              id="statusReason"
              placeholder={
                newStatus
                  ? "e.g. Identity and KYC verified via concierge."
                  : "e.g. Payment inquiry under review."
              }
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged in the immutable security audit timeline.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={newStatus ? "default" : "destructive"}
              onClick={handleUpdateStatus}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {newStatus ? "Confirm Re-activation" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTES DIALOG */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Concierge Dossier Notes: {targetCustomer?.fullName}
            </DialogTitle>
            <DialogDescription>
              Internal notes visible exclusively to administrators and personal styling concierge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Client prefers ivory and gold banarasi textiles; sizing is tailored."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setNotesDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNotes}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
