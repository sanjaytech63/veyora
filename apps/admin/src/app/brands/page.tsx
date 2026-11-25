"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/optimized-image";
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
import { notifyApiError, notifyApiSuccess, notifyWarning } from "@/lib/notifications";
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
      notifyApiError(err);
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
      notifyWarning("Brand name is required.");
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
        const updated = await adminCatalogApi.updateBrand(editingBrand.id, payload);
        notifyApiSuccess(updated);
      } else {
        const payload: CreateBrandInput = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          logo: logo.trim() || undefined,
          website: website.trim() || undefined,
          status,
        };
        const created = await adminCatalogApi.createBrand(payload);
        notifyApiSuccess(created);
      }

      setDialogOpen(false);
      loadBrands();
    } catch (err: unknown) {
      notifyApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm(`Are you sure you want to delete brand "${b.name}"?`)) return;
    try {
      const deleted = await adminCatalogApi.deleteBrand(b.id);
      notifyApiSuccess(deleted);
      loadBrands();
    } catch (err: unknown) {
      notifyApiError(err);
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Loading brands...
                    </TableCell>
                  </TableRow>
                ) : brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Tags className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium">No brands found</p>
                        <Button size="sm" variant="outline" onClick={handleOpenCreate}>
                          Add First Brand
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {b.logo ? (
                            <OptimizedImage
                              src={b.logo}
                              alt={b.name}
                              width={32}
                              height={32}
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
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.slug}</TableCell>
                      <TableCell className="text-muted-foreground">
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
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.status === "active" ? "default" : "secondary"}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "active" | "inactive")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
