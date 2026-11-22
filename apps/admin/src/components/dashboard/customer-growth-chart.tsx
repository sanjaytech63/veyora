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

interface CustomerGrowthChartProps {
  data: Array<{ date: string; newCustomers: number }>;
  isLoading?: boolean;
}

export function CustomerGrowthChart({ data, isLoading }: CustomerGrowthChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Mapping clientele growth trajectory...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-dashed border-border/80">
        <span className="text-xs text-muted-foreground">No customer acquisitions recorded in this interval.</span>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800" />
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
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#888888" }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length && payload[0]) {
                const count = payload[0].value;
                return (
                  <div className="rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-lg backdrop-blur-md">
                    <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs font-bold text-foreground">
                      <span>New Clients:</span>
                      <span className="text-purple-600 dark:text-purple-400 font-extrabold">{count}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="newCustomers"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#customerGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
