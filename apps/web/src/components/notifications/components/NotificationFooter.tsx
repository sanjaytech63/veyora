import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationFooterProps {
  onClose?: () => void;
  className?: string;
}

export function NotificationFooter({ onClose, className }: NotificationFooterProps) {
  return (
    <div className={cn("p-2.5 border-t border-border/60 bg-muted/20 text-center", className)}>
      <Link
        href="/account/notifications"
        onClick={onClose}
        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-primary/5 transition-colors"
      >
        <span>View all notifications</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
