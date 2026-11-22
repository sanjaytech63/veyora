"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { RevenueTimelinePoint } from "@veyora/types";

interface RevenueChartProps {
  data: RevenueTimelinePoint[];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Rendering revenue timeline...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-dashed border-border/80">
        <span className="text-xs text-muted-foreground">
          No revenue transactions recorded for selected date range.
        </span>
      </div>
    );
  }

  // Format currency tooltip
  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
            className="dark:stroke-neutral-800"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#888888" }}
            tickFormatter={(val) => {
              if (val.includes("-")) {
                const parts = val.split("-");
                return `${parts[1]}/${parts[2] || parts[1]}`;
              }
              return val;
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#888888" }}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length && payload[0]) {
                const p = payload[0].payload as RevenueTimelinePoint;
                return (
                  <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur-md">
                    <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between gap-4 text-xs font-bold text-foreground">
                        <span>Revenue:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {formatCurrency(p.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                        <span>Orders:</span>
                        <span className="font-semibold text-foreground">{p.orders} orders</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                        <span>AOV:</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(p.aov)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
