"use client";

import { SearchDialog } from "@/components/navigation/search";

export interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  return <SearchDialog open={open} onOpenChange={onOpenChange} />;
}
