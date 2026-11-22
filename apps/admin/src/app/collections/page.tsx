"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { EmptyState } from "@/components/ui/empty-state";
import { adminCatalogApi } from "@/lib/api/admin-catalog-api";
import { Collection } from "@veyora/types";
import { CreateCollectionInput } from "@veyora/validators";
import { Plus, RefreshCw, Trash2, Sparkles, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Form fields
  const [newName, setNewName] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newTagline, setNewTagline] = React.useState("");
  const [newSeason, setNewSeason] = React.useState("");
  const [newImage, setNewImage] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");

  const loadCollections = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCatalogApi.getCollections();
      setCollections(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load collections from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      const payload: CreateCollectionInput = {
        name: newName.trim(),
        slug: newSlug.trim() || undefined,
        tagline: newTagline.trim() || undefined,
        description: newDescription.trim() || undefined,
        season: newSeason.trim() || undefined,
        image: newImage.trim() || undefined,
        status: "active",
      };

      await adminCatalogApi.createCollection(payload);
      toast.success("Collection Created", {
        description: `"${newName}" published and persisted to MongoDB.`,
      });
      setCreateDialogOpen(false);
      setNewName("");
      setNewSlug("");
      setNewTagline("");
      setNewSeason("");
      setNewImage("");
      setNewDescription("");
      await loadCollections();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create collection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete collection "${name}"?`)) return;
    try {
      await adminCatalogApi.deleteCollection(id);
      toast.success("Collection Removed", {
        description: `Collection "${name}" deleted from database.`,
      });
      await loadCollections();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete collection.");
    }
  };

  return (
    <PageContainer
      title="Curated Collections & Lookbooks"
      description="Manage seasonal lookbooks, capsule wardrobes, and storefront featured edits persisted in MongoDB."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCollections}
            disabled={loading}
            className="gap-1.5 rounded-xl text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Create Lookbook Collection</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Publish a new fashion edit for the storefront and campaign lookbooks.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCollection} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Collection Name *</label>
                  <Input
                    required
                    placeholder="e.g. Royal Banarasi Heirlooms"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newSlug) {
                        setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }
                    }}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">URL Slug</label>
                  <Input
                    placeholder="e.g. royal-banarasi-heirlooms"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Subheading Tagline</label>
                  <Input
                    placeholder="e.g. Handwoven Zari & Silk"
                    value={newTagline}
                    onChange={(e) => setNewTagline(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Season / Occasion</label>
                  <Input
                    placeholder="e.g. Festive / Autumn 2026"
                    value={newSeason}
                    onChange={(e) => setNewSeason(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Description</label>
                  <Input
                    placeholder="Brief editorial description for lookbook showcase"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Cover Image URL</label>
                  <Input
                    placeholder="https://images.unsplash.com/... or Cloudinary URL"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl text-xs font-bold h-10 mt-2"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      Saving to MongoDB...
                    </span>
                  ) : (
                    "Publish Collection"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            <span>Loading collections from database...</span>
          </div>
        ) : collections.length === 0 ? (
          <div className="py-16 px-4">
            <EmptyState
              icon={<Sparkles className="h-8 w-8 text-muted-foreground" />}
              title="No collections published yet"
              description="Create your first lookbook collection to curate garments into seasonal edits for the storefront."
              action={
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="gap-1.5 rounded-xl text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create First Collection
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-[80px]">Cover</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Garments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {collections.map((col) => (
                <TableRow key={col.id}>
                  <TableCell>
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border/60 bg-muted/40">
                      {col.image ? (
                        <OptimizedImage
                          src={col.image}
                          alt={col.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground">{col.name}</div>
                    <div className="text-[10px] text-muted-foreground">{col.tagline}</div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{col.slug}</TableCell>
                  <TableCell>{col.season || "All Seasons"}</TableCell>
                  <TableCell className="font-bold tabular-nums">
                    {col.productCount || 0} pieces
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="text-[10px] font-semibold uppercase">
                      {col.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(col.id, col.name)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Delete collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
