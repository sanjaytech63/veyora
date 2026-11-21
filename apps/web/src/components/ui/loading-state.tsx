import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
  ...props
}: LoadingStateProps) {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-muted-foreground animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <LoaderCircle className={cn("animate-spin text-primary", iconSizes[size])} />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
}
