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
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  season: string;
  productCount: number;
  image: string;
  status: "active" | "draft";
}

const INITIAL_COLLECTIONS: CollectionItem[] = [
  {
    id: "col-1",
    name: "The Festive Edit // 2026",
    slug: "festive-edit",
    tagline: "Handcrafted Indian Couture",
    season: "Festive / Wedding 2026",
    productCount: 8,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
    status: "active",
  },
  {
    id: "col-2",
    name: "Wedding Trousseau & Bridal Heritage",
    slug: "wedding-trousseau",
    tagline: "Heirloom Silks & Zardozi",
    season: "Bridal Heirloom",
    productCount: 6,
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&q=80",
    status: "active",
  },
  {
    id: "col-3",
    name: "Everyday Mulmul & Studio Tunics",
    slug: "everyday-mulmul",
    tagline: "Pure Organic Cotton",
    season: "Everyday Wear",
    productCount: 12,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80",
    status: "active",
  },
  {
    id: "col-4",
    name: "Resort Linen & Loungewear",
    slug: "resort-linen",
    tagline: "Contemporary Minimalist Cuts",
    season: "Summer Capsule",
    productCount: 7,
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80",
    status: "active",
  },
];

export default function AdminCollectionsPage() {
  const [collections, setCollections] = React.useState<CollectionItem[]>(INITIAL_COLLECTIONS);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newTagline, setNewTagline] = React.useState("");
  const [newSeason, setNewSeason] = React.useState("");
  const [newImage, setNewImage] = React.useState("");

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCol: CollectionItem = {
      id: `col-${Date.now()}`,
      name: newName,
      slug: newSlug || newName.toLowerCase().replace(/\s+/g, "-"),
      tagline: newTagline || "Curated Capsule",
      season: newSeason || "Current Season",
      productCount: 0,
      image: newImage || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80",
      status: "active",
    };

    setCollections((prev) => [newCol, ...prev]);
    toast.success("Collection Created", { description: `${newName} published successfully.` });
    setCreateDialogOpen(false);
    setNewName("");
    setNewSlug("");
    setNewTagline("");
    setNewSeason("");
    setNewImage("");
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"?`)) return;
    setCollections((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Collection "${name}" removed.`);
  };

  return (
    <PageContainer
      title="Curated Collections & Lookbooks"
      description="Manage seasonal lookbooks, capsule wardrobes, and homepage featured edits."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Collections Refreshed")}
            className="gap-1.5 rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
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
                  Publish a new fashion edit for the storefront and campaign banners.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCollection} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Collection Name</label>
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
                    required
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
                  <label className="text-xs font-semibold">Cover Image URL</label>
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl text-xs font-bold h-10 mt-2">
                  Publish Collection
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
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
                    <OptimizedImage
                      src={col.image}
                      alt={col.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-foreground">{col.name}</div>
                  <div className="text-[10px] text-muted-foreground">{col.tagline}</div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">{col.slug}</TableCell>
                <TableCell>{col.season}</TableCell>
                <TableCell className="font-bold tabular-nums">{col.productCount} pieces</TableCell>
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
      </div>
    </PageContainer>
  );
}
