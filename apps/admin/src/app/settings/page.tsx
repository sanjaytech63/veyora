"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";
import { SERVICES } from "@veyora/config";
import { adminSystemApi } from "@/lib/api/admin-system-api";
import { RefreshCw, LoaderCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = React.useState("Veyora Fashion Atelier");
  const [currency, setCurrency] = React.useState("USD ($)");
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState("150");
  const [enableExpress, setEnableExpress] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSystemApi.getSettings();
      if (data) {
        setStoreName(data.storeName || "Veyora Fashion Atelier");
        setCurrency(data.currency || "USD ($)");
        setFreeShippingThreshold(String(data.freeShippingThreshold ?? 150));
        setEnableExpress(Boolean(data.enableExpress));
      }
    } catch (err: unknown) {
      notifyApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await adminSystemApi.updateSettings({
        storeName: storeName.trim(),
        currency: currency.trim(),
        freeShippingThreshold: Number(freeShippingThreshold) || 0,
        enableExpress,
      });
      notifyApiSuccess(result);
    } catch (err: unknown) {
      notifyApiError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Store Settings & Configuration"
      description={`Global operational parameters for ${SERVICES.NAME} Fashion Commerce.`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={loadSettings}
          disabled={loading}
          className="gap-1.5 rounded-xl text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-bold">Store Identity & Currencies</CardTitle>
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
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Default Settlement Currency</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl text-xs"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-bold">Shipping & Logistics Rules</CardTitle>
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
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold">Enable Priority Air Courier</label>
                <p className="text-[11px] text-muted-foreground">
                  Offer 1-2 day express shipping option during checkout.
                </p>
              </div>
              <Switch
                checked={enableExpress}
                onCheckedChange={setEnableExpress}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={saving || loading}
          className="rounded-xl px-6 text-xs font-bold h-10"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Saving to MongoDB...
            </span>
          ) : (
            "Save Settings"
          )}
        </Button>
      </form>
    </PageContainer>
  );
}
