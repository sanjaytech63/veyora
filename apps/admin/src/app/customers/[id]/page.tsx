"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  MapPin,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { adminCustomersApi } from "@/lib/api/admin-customers-api";
import { CustomerDetailDto, CustomerActivityDto } from "@veyora/types";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = React.useState<CustomerDetailDto | null>(null);
  const [activities, setActivities] = React.useState<CustomerActivityDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Status Change Dialog State
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [targetStatus, setTargetStatus] = React.useState(false);
  const [statusReason, setStatusReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Notes Dialog State
  const [notesDialogOpen, setNotesDialogOpen] = React.useState(false);
  const [customerNotes, setCustomerNotes] = React.useState("");

  const fetchData = React.useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [customerData, activityData] = await Promise.all([
        adminCustomersApi.getCustomer(customerId),
        adminCustomersApi.getCustomerActivity(customerId),
      ]);
      setCustomer(customerData);
      setActivities(activityData);
      setCustomerNotes(customerData.notes || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load customer profile";
      toast.error("Error loading patron dossier", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Status Dialog
  const openStatusDialog = (newActiveState: boolean) => {
    setTargetStatus(newActiveState);
    setStatusReason(customer?.statusReason || "");
    setStatusDialogOpen(true);
  };

  // Submit Status Change
  const handleUpdateStatus = async () => {
    if (!customer) return;
    setActionLoading(true);
    try {
      const updated = await adminCustomersApi.updateCustomerStatus(customer.id, {
        isActive: targetStatus,
        reason: statusReason.trim() || undefined,
      });

      setCustomer((prev) => (prev ? { ...prev, ...updated } : null));
      const refreshedActivities = await adminCustomersApi.getCustomerActivity(customer.id);
      setActivities(refreshedActivities);

      toast.success(`Patron account ${updated.isActive ? "re-activated" : "suspended"}`, {
        description: `Updated standing for ${updated.fullName}`,
      });
      setStatusDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update standing";
      toast.error("Status update error", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Notes
  const handleUpdateNotes = async () => {
    if (!customer) return;
    setActionLoading(true);
    try {
      const updated = await adminCustomersApi.updateCustomerNotes(customer.id, {
        notes: customerNotes.trim(),
      });

      setCustomer((prev) => (prev ? { ...prev, notes: updated.notes } : null));
      const refreshedActivities = await adminCustomersApi.getCustomerActivity(customer.id);
      setActivities(refreshedActivities);

      toast.success("Dossier Saved", { description: "Internal patron notes updated." });
      setNotesDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update notes";
      toast.error("Note save error", { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground opacity-50" />
          <p className="text-sm font-serif text-muted-foreground">Consulting patron records...</p>
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-serif font-medium">Patron Record Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            The requested customer profile does not exist or may have been archived.
          </p>
          <Button variant="outline" onClick={() => router.push("/customers")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Return to Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/customers"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Patrons
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{customer.fullName}</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground md:text-3xl">
                {customer.fullName}
              </h1>
              {customer.isActive ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                  Active Client
                </Badge>
              ) : (
                <Badge variant="destructive">Suspended</Badge>
              )}
              {customer.totalSpent > 1000 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-600 bg-amber-500/5 font-mono text-xs"
                >
                  VIP Haute Couture
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-4">
              <span>
                Client ID: <span className="font-mono">{customer.id}</span>
              </span>
              <span>Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotesDialogOpen(true)}
              className="gap-2 text-xs"
            >
              <FileText className="h-3.5 w-3.5" />
              Dossier Notes
            </Button>
            <Button
              variant={customer.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => openStatusDialog(!customer.isActive)}
              className="gap-2 text-xs"
            >
              {customer.isActive ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" /> Suspend Client
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Re-activate Client
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Lifetime Financial KPI Summary */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/40 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Lifetime Spend
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                $
                {customer.totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across confirmed garment orders</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Orders
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{customer.ordersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders placed with atelier</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Average Order Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                ${customer.averageOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Spend per checkout</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Last Order Date
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold mt-1">
                {customer.lastOrderAt
                  ? new Date(customer.lastOrderAt).toLocaleDateString()
                  : "No orders yet"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Most recent engagement</p>
            </CardContent>
          </Card>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile & Addresses */}
          <div className="flex flex-col gap-6">
            {/* Patron Profile Card */}
            <Card className="border border-border/40">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-serif font-medium">
                  Patron Identity & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Email Address</span>
                    <span className="font-medium text-foreground">{customer.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Telephone</span>
                    <span className="font-mono text-foreground">
                      {customer.phone || "Not recorded"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Account Created</span>
                    <span>{new Date(customer.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {customer.isEmailVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Email Verification</span>
                    <span
                      className={
                        customer.isEmailVerified ? "text-emerald-600 font-medium" : "text-amber-600"
                      }
                    >
                      {customer.isEmailVerified ? "Verified Patron" : "Verification Pending"}
                    </span>
                  </div>
                </div>

                {customer.statusReason && (
                  <div className="p-3 bg-muted/40 rounded-md border border-border/40 mt-2">
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase">
                      Status Note:
                    </span>
                    <p className="mt-0.5 text-foreground">{customer.statusReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Addresses Card */}
            <Card className="border border-border/40">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-serif font-medium">Saved Addresses</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {customer.addresses.length} on file
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {customer.addresses.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No addresses recorded on patron account.
                  </p>
                ) : (
                  customer.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs space-y-1 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium font-serif">
                          {address.firstName} {address.lastName}
                        </span>
                        {address.isDefault && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary border-0"
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {address.street}
                        {address.apartment ? `, ${address.apartment}` : ""}
                      </p>
                      <p className="text-muted-foreground pl-4.5">
                        {address.city}, {address.state} {address.postalCode}, {address.country}
                      </p>
                      {address.phone && (
                        <p className="text-muted-foreground pl-4.5 font-mono text-[11px]">
                          Tel: {address.phone}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Concierge Dossier Notes */}
            <Card className="border border-border/40">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-serif font-medium">
                  Concierge Dossier Notes
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotesDialogOpen(true)}
                  className="h-7 text-xs px-2"
                >
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="pt-4 text-xs">
                {customer.notes ? (
                  <p className="whitespace-pre-line text-foreground/90 italic bg-muted/20 p-3 rounded-md border border-border/30">
                    "{customer.notes}"
                  </p>
                ) : (
                  <p className="text-muted-foreground italic py-2">
                    No concierge notes recorded for this patron.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order History & Activity Audit */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Orders History Card */}
            <Card className="border border-border/40">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-serif font-medium">Order History</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Orders placed under client account
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {customer.ordersCount} Total Orders
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {customer.recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No orders have been placed by this patron yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs">Order</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Items</TableHead>
                        <TableHead className="text-xs">Total</TableHead>
                        <TableHead className="text-xs text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.recentOrders.map((order) => (
                        <TableRow key={order.id} className="text-xs hover:bg-muted/20">
                          <TableCell className="font-mono font-medium">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${
                                order.status === "delivered"
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5"
                                  : order.status === "cancelled"
                                    ? "border-destructive/40 text-destructive bg-destructive/5"
                                    : "border-primary/40 text-primary bg-primary/5"
                              }`}
                            >
                              {order.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.items?.length || 0} items</TableCell>
                          <TableCell className="font-serif font-semibold">
                            ${order.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-7 px-2 text-xs gap-1"
                            >
                              <Link href={`/orders/${order.id}`}>
                                View <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Account Activity Audit Timeline */}
            <Card className="border border-border/40">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-serif font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Security & Account Audit Trail
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Immutable event log of administrative actions and status updates
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No account modifications logged yet.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                    {activities.map((act) => (
                      <div key={act.id} className="relative text-xs space-y-1">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground font-mono">
                            {act.action}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(act.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {act.reason && <p className="text-muted-foreground">"{act.reason}"</p>}
                        <p className="text-[11px] text-muted-foreground">
                          Logged by:{" "}
                          <span className="font-medium text-foreground">{act.performedBy}</span> (
                          {act.performerRole})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* STATUS CHANGE DIALOG */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              {targetStatus ? "Re-activate Patron Standing" : "Suspend Patron Account"}
            </DialogTitle>
            <DialogDescription>
              {targetStatus
                ? `Restore checkout and order placement privileges for ${customer.fullName}.`
                : `Suspend ${customer.fullName} from logging in or placing new atelier orders.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder={
                targetStatus
                  ? "e.g. Identity and KYC verified via concierge."
                  : "e.g. Payment inquiry under review."
              }
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This statement will be preserved in the audit timeline.
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
              variant={targetStatus ? "default" : "destructive"}
              onClick={handleUpdateStatus}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {targetStatus ? "Confirm Re-activation" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTES DIALOG */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Edit Concierge Notes</DialogTitle>
            <DialogDescription>
              Update styling preferences, bespoke measurement notes, or private requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Record patron styling notes..."
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
            <Button onClick={handleUpdateNotes} disabled={actionLoading} className="gap-2">
              {actionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              Save Dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
