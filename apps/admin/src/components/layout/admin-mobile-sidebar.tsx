"use client";

import * as React from "react";
import { useAdminUIStore } from "@/stores/admin-ui-store";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AdminNav } from "./admin-nav";
import { SERVICES } from "@veyora/config";
import { Layers, X } from "lucide-react";

export function AdminMobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAdminUIStore();

  return (
    <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <DrawerContent className="p-4 max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5 text-primary" />
            {SERVICES.NAME} Admin Console
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="py-4 overflow-y-auto">
          <AdminNav />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
