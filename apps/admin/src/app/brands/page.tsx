"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminCatalogApi } from "@/lib/api/admin-catalog-api";
import { Brand } from "@veyora/types";
import { CreateBrandInput, UpdateBrandInput } from "@veyora/validators";
import { toast } from "sonner";
import { Tags, Plus, RefreshCw, Edit, Trash2, Globe, ExternalLink } from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);

  // Form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [logo, setLogo] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = React.useState(false);

  const loadBrands = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCatalogApi.getBrands();
      setBrands(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setDescription("");
    setLogo("");
    setWebsite("");
    setStatus("active");
    setDialogOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setDescription(b.description || "");
    setLogo(b.logo || "");
    setWebsite(b.website || "");
    setStatus(b.status);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Brand name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingBrand) {
        const payload: UpdateBrandInput = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          logo: logo.trim() || undefined,
          website: website.trim() || undefined,
          status,
        };
        await adminCatalogApi.updateBrand(editingBrand.id, payload);
        toast.success("Brand updated successfully.");
      } else {
        const payload: CreateBrandInput = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          logo: logo.trim() || undefined,
          website: website.trim() || undefined,
          status,
        };
        await adminCatalogApi.createBrand(payload);
        toast.success("Brand created successfully.");
      }

      setDialogOpen(false);
      loadBrands();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save brand.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm(`Are you sure you want to delete brand "${b.name}"?`)) return;
    try {
      await adminCatalogApi.deleteBrand(b.id);
      toast.success("Brand deleted.");
      loadBrands();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cannot delete brand associated with active products.");
    }
  };

  return (
    <PageContainer
      title="Brand Directory"
      description="Manage brand partners, manufacturer labels, and official web profiles."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBrands}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add Brand
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Brands ({brands.length})
            </CardTitle>
            <CardDescription>
              Assign products to brands for filtered browsing on the storefront.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Brand Name
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Slug
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Website
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="h-24 text-center text-muted-foreground">
                        Loading brands...
                      </td>
                    </tr>
                  ) : brands.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Tags className="h-8 w-8 text-muted-foreground/40" />
                          <p className="font-medium">No brands found</p>
                          <Button size="sm" variant="outline" onClick={handleOpenCreate}>
                            Add First Brand
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    brands.map((b) => (
                      <tr key={b.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">
                          <div className="flex items-center gap-3">
                            {b.logo ? (
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="h-8 w-8 rounded-md border object-contain p-0.5"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {b.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{b.name}</p>
                              {b.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {b.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle font-mono text-xs">{b.slug}</td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {b.website ? (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]">{b.website}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={b.status === "active" ? "default" : "secondary"}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEdit(b)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleDelete(b)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "New Brand"}</DialogTitle>
            <DialogDescription>
              {editingBrand
                ? "Modify brand profile and website reference."
                : "Register a brand or manufacturer."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name *</label>
              <Input
                required
                placeholder="e.g. Sony, Nike, Apple"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (Optional)</label>
              <Input
                placeholder="e.g. apple"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo Image URL</label>
              <Input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingBrand ? "Save Changes" : "Create Brand"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
