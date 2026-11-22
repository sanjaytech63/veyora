import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "default" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function LoadingSpinner({ size = "default", className, ...props }: LoadingSpinnerProps) {
  return (
    <LoaderCircle
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
      {...props}
    />
  );
}
