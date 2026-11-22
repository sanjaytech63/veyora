"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown } from "lucide-react";
import { AnalyticsPeriod } from "@veyora/types";

interface DashboardDateFilterProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "12m": "Last 12 Months",
  ytd: "Year to Date",
  custom: "Custom Range",
};

export function DashboardDateFilter({
  period,
  onPeriodChange,
  startDate,
  endDate,
  onCustomDateChange,
}: DashboardDateFilterProps) {
  const [customStart, setCustomStart] = React.useState(startDate || "");
  const [customEnd, setCustomEnd] = React.useState(endDate || "");
  const [showCustomInputs, setShowCustomInputs] = React.useState(period === "custom");

  const handleSelectPeriod = (newPeriod: AnalyticsPeriod) => {
    onPeriodChange(newPeriod);
    if (newPeriod === "custom") {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd && onCustomDateChange) {
      onCustomDateChange(customStart, customEnd);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-xl text-xs font-semibold bg-background hover:bg-muted/50 border-border/80"
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{PERIOD_LABELS[period]}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl">
          {(["today", "7d", "30d", "90d", "12m", "ytd", "custom"] as AnalyticsPeriod[]).map((p) => (
            <DropdownMenuItem
              key={p}
              onClick={() => handleSelectPeriod(p)}
              className={`rounded-lg text-xs cursor-pointer ${
                period === p ? "bg-primary/10 text-primary font-bold" : "text-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Inputs */}
      {showCustomInputs && (
        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-8 text-xs rounded-xl w-32 border-border/80"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-8 text-xs rounded-xl w-32 border-border/80"
          />
          <Button
            size="sm"
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd}
            className="h-8 rounded-xl text-xs font-semibold px-3"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
