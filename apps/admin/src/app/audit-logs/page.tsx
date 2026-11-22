"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { adminRbacApi } from "@/lib/api/admin-rbac-api";
import { AuditLogDto } from "@veyora/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  History,
  Shield,
  Search,
  Filter,
  Eye,
  Loader2,
  Calendar,
  Globe,
  RefreshCw,
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");

  // Inspect Modal
  const [inspectLog, setInspectLog] = useState<AuditLogDto | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminRbacApi.listAuditLogs({ limit: 100 });
      setLogs(res.logs);
    } catch {
      toast.error("Failed to load security audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "all" && !log.action.includes(actionFilter.toUpperCase())) return false;
      if (resourceFilter !== "all" && log.resource !== resourceFilter.toLowerCase()) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.actorEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
        (log.resourceId && log.resourceId.toLowerCase().includes(q))
      );
    });
  }, [logs, searchQuery, actionFilter, resourceFilter]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes("CREATE") || action.includes("ACTIVATE")) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("UPDATE")) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
    if (action.includes("DELETE") || action.includes("DEACTIVATE")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Security & Administrative Audit Trail
            </h1>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary font-mono text-[11px]"
            >
              Compliance & Security
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable chronicle of administrative interventions, role modifications, and staff
            actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-2 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Audit Trail</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by actor, action, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>

          <Button
            variant={resourceFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setResourceFilter("all")}
            className="h-8 text-xs"
          >
            All Resources
          </Button>
          <Button
            variant={resourceFilter === "staff" ? "default" : "outline"}
            size="sm"
            onClick={() => setResourceFilter("staff")}
            className="h-8 text-xs"
          >
            Staff
          </Button>
          <Button
            variant={resourceFilter === "role" ? "default" : "outline"}
            size="sm"
            onClick={() => setResourceFilter("role")}
            className="h-8 text-xs"
          >
            Roles
          </Button>

          <Button
            variant={actionFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter(actionFilter === "all" ? "CREATE" : "all")}
            className="h-8 text-xs"
          >
            {actionFilter === "all" ? "All Actions" : `Action: ${actionFilter}`}
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold text-xs">Timestamp</TableHead>
              <TableHead className="font-bold text-xs">Actor</TableHead>
              <TableHead className="font-bold text-xs">Action</TableHead>
              <TableHead className="font-bold text-xs">Resource</TableHead>
              <TableHead className="font-bold text-xs">Target Entity ID</TableHead>
              <TableHead className="font-bold text-xs">Network & Host</TableHead>
              <TableHead className="text-right font-bold text-xs">Inspect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs">Loading audit ledger...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <History className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold">
                      No audit events logged matching query
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const date = new Date(log.createdAt);

                return (
                  <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{date.toLocaleDateString()}</span>
                        <span className="text-muted-foreground">{date.toLocaleTimeString()}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-foreground">{log.actorEmail}</div>
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-mono uppercase bg-accent/40"
                        >
                          {log.actorRole}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold tracking-wider border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold uppercase font-mono text-muted-foreground">
                        {log.resource}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.resourceId ? (
                        <span
                          className="truncate max-w-[150px] inline-block"
                          title={log.resourceId}
                        >
                          {log.resourceId}
                        </span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span>{log.ipAddress}</span>
                        </div>
                      ) : (
                        <span className="italic text-[11px]">internal</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectLog(log)}
                        className="gap-1.5 text-xs h-7 px-2"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Inspect Log Details Modal */}
      <Dialog open={Boolean(inspectLog)} onOpenChange={(open) => !open && setInspectLog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Audit Log Details</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cryptographic security event payload and actor attribution metadata.
            </DialogDescription>
          </DialogHeader>

          {inspectLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Actor:</span>
                  <span className="font-bold text-foreground">{inspectLog.actorEmail}</span>{" "}
                  <span className="font-mono text-[10px]">({inspectLog.actorRole})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Timestamp:</span>
                  <span className="font-mono text-foreground">
                    {new Date(inspectLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Action:</span>
                  <span className="font-mono font-bold text-primary">{inspectLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Resource / Target:
                  </span>
                  <span className="font-mono text-foreground">
                    {inspectLog.resource}{" "}
                    {inspectLog.resourceId ? `(${inspectLog.resourceId})` : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground">Event Diff & Payload:</span>
                <pre className="p-3 bg-muted/60 rounded-xl border border-border/80 text-[11px] font-mono max-h-56 overflow-y-auto text-foreground whitespace-pre-wrap">
                  {inspectLog.details
                    ? JSON.stringify(inspectLog.details, null, 2)
                    : "No details recorded."}
                </pre>
              </div>

              {inspectLog.userAgent && (
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  User Agent: {inspectLog.userAgent}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
