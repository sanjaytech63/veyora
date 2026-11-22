"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { OrderStatusDistribution } from "@veyora/types";

interface OrderStatusChartProps {
  data: OrderStatusDistribution[];
  isLoading?: boolean;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  delivered: "#10b981", // Emerald
  shipped: "#0ea5e9", // Sky
  processing: "#6366f1", // Indigo
  confirmed: "#8b5cf6", // Purple
  pending: "#f59e0b", // Amber
  cancelled: "#f43f5e", // Rose
  refund_pending: "#ec4899", // Pink
  refunded: "#64748b", // Slate
};

export function OrderStatusChart({ data, isLoading }: OrderStatusChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Analyzing fulfillment distribution...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-dashed border-border/80">
        <span className="text-xs text-muted-foreground">No order status data available.</span>
      </div>
    );
  }

  const chartData = data.filter((d) => d.count > 0);

  return (
    <div className="flex flex-col items-center justify-between h-[280px] w-full">
      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
              nameKey="status"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLOR_MAP[entry.status] || "#94a3b8"}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length && payload[0]) {
                  const p = payload[0].payload as OrderStatusDistribution;
                  return (
                    <div className="rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-lg backdrop-blur-md">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR_MAP[p.status] || "#94a3b8" }}
                        />
                        <span className="text-xs font-bold capitalize text-foreground">
                          {p.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{p.count} orders</span> (
                        {p.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Legend Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-full px-2">
        {chartData.map((item) => (
          <div
            key={item.status}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/50 border border-border/60"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLOR_MAP[item.status] || "#94a3b8" }}
            />
            <span className="capitalize text-muted-foreground">
              {item.status.replace("_", " ")}
            </span>
            <span className="font-semibold text-foreground">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
