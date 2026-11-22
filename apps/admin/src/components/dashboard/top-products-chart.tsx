"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TopSellingProductDto } from "@veyora/types";

interface TopProductsChartProps {
  data: TopSellingProductDto[];
  isLoading?: boolean;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Calculating bestseller volume...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-dashed border-border/80">
        <span className="text-xs text-muted-foreground">No product sales recorded in this interval.</span>
      </div>
    );
  }

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:stroke-neutral-800" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#888888" }}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <YAxis
            type="category"
            dataKey="sku"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#888888" }}
            width={70}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length && payload[0]) {
                const p = payload[0].payload as TopSellingProductDto;
                return (
                  <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur-md max-w-xs">
                    <div className="text-xs font-bold text-foreground line-clamp-1">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">SKU: {p.sku}</div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Units Sold:</span>
                        <span className="font-semibold text-foreground">{p.unitsSold} units</span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Current Stock:</span>
                        <span className="font-semibold text-foreground">{p.currentStock} in atelier</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="totalRevenue"
            fill="#6366f1"
            radius={[0, 6, 6, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
