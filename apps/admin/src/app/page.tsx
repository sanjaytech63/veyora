"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable, Column } from "@/components/common/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAdminUIStore } from "@/stores/admin-ui-store";
import { SERVICES } from "@veyora/config";
import { Server, Activity, Plus, RefreshCw, ShieldCheck, CheckCircle2, Clock } from "lucide-react";

interface ServiceRecord extends Record<string, unknown> {
  id: string;
  name: string;
  port: number;
  environment: string;
  status: "healthy" | "idle" | "ready";
  uptime: string;
}

const sampleServices: ServiceRecord[] = [
  {
    id: "srv-1",
    name: "@veyora/api (Express REST)",
    port: 4000,
    environment: "development",
    status: "healthy",
    uptime: "99.98%",
  },
  {
    id: "srv-2",
    name: "@veyora/worker (BullMQ)",
    port: 6379,
    environment: "development",
    status: "ready",
    uptime: "99.95%",
  },
  {
    id: "srv-3",
    name: "MongoDB 7.0 Document Store",
    port: 27017,
    environment: "docker",
    status: "healthy",
    uptime: "100%",
  },
  {
    id: "srv-4",
    name: "Redis 7.2 Broker",
    port: 6379,
    environment: "docker",
    status: "healthy",
    uptime: "100%",
  },
  {
    id: "srv-5",
    name: "@veyora/web (Next.js 15)",
    port: 3000,
    environment: "development",
    status: "ready",
    uptime: "99.99%",
  },
  {
    id: "srv-6",
    name: "@veyora/admin (Next.js 15)",
    port: 3001,
    environment: "development",
    status: "ready",
    uptime: "99.99%",
  },
];

const configSchema = z.object({
  serviceKey: z.string().min(3, "Key must be at least 3 characters"),
  rateLimit: z.coerce.number().min(10, "Minimum rate limit is 10 req/min"),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export default function AdminHomePage() {
  const { tableDensity, setTableDensity } = useAdminUIStore();
  const [modalOpen, setModalOpen] = React.useState(false);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      serviceKey: "API_GATEWAY_THROTTLE",
      rateLimit: 100,
    },
  });

  const columns: Column<ServiceRecord>[] = [
    {
      key: "name",
      header: "Service Component",
      sortable: true,
      render: (row) => <div className="font-medium text-foreground">{row.name}</div>,
    },
    {
      key: "port",
      header: "Port",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{row.port}</span>
      ),
    },
    {
      key: "environment",
      header: "Target Env",
      sortable: true,
    },
    {
      key: "status",
      header: "Health Status",
      sortable: true,
      render: (row) => (
        <Badge
          variant={row.status === "healthy" ? "success" : "secondary"}
          className="capitalize gap-1"
        >
          {row.status === "healthy" ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          ) : (
            <Clock className="w-3 h-3 text-muted-foreground" />
          )}
          {row.status}
        </Badge>
      ),
    },
    {
      key: "uptime",
      header: "Uptime SLA",
      sortable: true,
    },
  ];

  const handleCreateConfig = (values: ConfigFormValues) => {
    toast.success("Configuration Updated", {
      description: `Set ${values.serviceKey} to ${values.rateLimit} req/min.`,
    });
    setModalOpen(false);
  };

  return (
    <PageContainer
      title="Platform Operations"
      description={`System administration and design system verification for ${SERVICES.NAME} Admin.`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Cache refreshed", { description: "TanStack Query cache invalidated." })
            }
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Cache
          </Button>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Config Parameter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Service Variable</DialogTitle>
                <DialogDescription>
                  Demonstration of Modal Dialog integrated with React Hook Form and Zod validation.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateConfig)} className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="serviceKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parameter Key</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Limit (Req/min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Save Configuration
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core API Service</CardTitle>
            <Server className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Port 4000</div>
            <p className="text-xs text-muted-foreground mt-1">Modular Express Node 24</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worker Queues</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BullMQ + Redis</div>
            <p className="text-xs text-muted-foreground mt-1">Distributed background jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Design System</CardTitle>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Phase B Ready</div>
            <p className="text-xs text-muted-foreground mt-1">
              Next.js 15 · Tailwind v4 · shadcn/ui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Infrastructure Showcase */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">System Components Table</h2>
            <p className="text-sm text-muted-foreground">
              Searchable, sortable, and paginated data table infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Density:</span>
            <Button
              variant={tableDensity === "compact" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTableDensity("compact")}
            >
              Compact
            </Button>
            <Button
              variant={tableDensity === "normal" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTableDensity("normal")}
            >
              Normal
            </Button>
          </div>
        </div>

        <DataTable
          data={sampleServices}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Filter components..."
          pageSize={4}
        />
      </div>
    </PageContainer>
  );
}
