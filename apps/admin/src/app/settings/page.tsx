"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SERVICES } from "@veyora/config";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = React.useState("Veyora Fashion Atelier");
  const [currency, setCurrency] = React.useState("USD ($)");
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState("150");
  const [enableExpress, setEnableExpress] = React.useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings Saved", { description: "Store parameters updated successfully." });
  };

  return (
    <PageContainer
      title="Store Settings &amp; Configuration"
      description={`Global operational parameters for ${SERVICES.NAME} Fashion Commerce.`}
    >
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-bold">Store Identity &amp; Currencies</CardTitle>
            <CardDescription className="text-xs">
              General display parameters for customer storefronts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Store Brand Name</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Default Settlement Currency</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-bold">Shipping &amp; Logistics Rules</CardTitle>
            <CardDescription className="text-xs">
              Fulfillment thresholds and courier parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Free Express Shipping Threshold ($)</label>
              <Input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold">Enable Priority Air Courier</label>
                <p className="text-[11px] text-muted-foreground">
                  Offer 1-2 day express shipping option during checkout.
                </p>
              </div>
              <Switch checked={enableExpress} onCheckedChange={setEnableExpress} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="rounded-xl px-6 text-xs font-bold h-10">
          Save Settings
        </Button>
      </form>
    </PageContainer>
  );
}
