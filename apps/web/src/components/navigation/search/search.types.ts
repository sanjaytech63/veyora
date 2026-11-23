import { Product } from "@veyora/types";

export interface SearchNavigationItem {
  id: string;
  type: "suggestion" | "category" | "product" | "recent";
  title: string;
  url?: string;
  product?: Product;
}

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export interface SearchTriggerProps {
  onClick?: () => void;
  className?: string;
  variant?: "pill" | "icon";
}
