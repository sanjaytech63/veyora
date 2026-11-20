import { Button } from "@/components/ui/button";
import { SERVICES } from "@veyora/config";
import { LayoutDashboard, Settings, ShieldCheck, Server, Database, Activity } from "lucide-react";

export default function AdminHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
            <span className="font-semibold text-lg text-white">
              {SERVICES.NAME} <span className="text-indigo-400">Admin</span>
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
              v{SERVICES.VERSION}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Workspace apps/admin
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Operations & Management Console
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Modular administrative panel foundation for platform operations, system observability,
            and tenant management.
          </p>
        </div>

        {/* Status Metrics Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">API Service</span>
              <Server className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">Port 4000</div>
            <p className="text-xs text-emerald-400 mt-1">Modular Express Node.js 24</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Background Worker</span>
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">BullMQ Engine</div>
            <p className="text-xs text-blue-400 mt-1">Redis queue processor active</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Data Stores</span>
              <Database className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">Mongo & Redis</div>
            <p className="text-xs text-amber-400 mt-1">Docker Compose infrastructure</p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-base font-semibold text-white mb-2">Foundation Quick Actions</h2>
          <p className="text-sm text-slate-400 mb-6">
            Pre-configured shadcn/ui buttons demonstrating theme tokens and variant styling.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure System
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
