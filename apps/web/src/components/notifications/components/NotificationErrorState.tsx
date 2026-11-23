import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export function NotificationErrorState({ onRetry, className }: NotificationErrorStateProps) {
  return (
    <div className={cn("p-8 text-center space-y-3", className)} role="alert">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Unable to load notices</p>
        <p className="text-[11px] text-muted-foreground">
          There was an error communicating with the notification service.
        </p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="rounded-full text-xs h-7 px-3 gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Retry</span>
        </Button>
      )}
    </div>
  );
}
