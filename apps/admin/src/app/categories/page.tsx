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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminCatalogApi } from "@/lib/api/admin-catalog-api";
import { Category } from "@veyora/types";
import { CreateCategoryInput, UpdateCategoryInput } from "@veyora/validators";
import { toast } from "sonner";
import {
  FolderTree,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Folder,
  FolderPlus,
  ArrowRight,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  // Form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("");
  const [image, setImage] = React.useState("");
  const [order, setOrder] = React.useState<number>(0);
  const [status, setStatus] = React.useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCatalogApi.getCategories();
      setCategories(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setParentId("");
    setImage("");
    setOrder(0);
    setStatus("active");
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setParentId(cat.parentId || "");
    setImage(cat.image || "");
    setOrder(cat.order);
    setStatus(cat.status);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const payload: UpdateCategoryInput = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          parentId: parentId || null,
          image: image.trim(),
          order: Number(order),
          status,
        };
        await adminCatalogApi.updateCategory(editingCategory.id, payload);
        toast.success("Category updated successfully.");
      } else {
        const payload: CreateCategoryInput = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          parentId: parentId || undefined,
          image: image.trim(),
          order: Number(order),
          status,
        };
        await adminCatalogApi.createCategory(payload);
        toast.success("Category created successfully.");
      }

      setDialogOpen(false);
      loadCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await adminCatalogApi.deleteCategory(cat.id);
      toast.success("Category deleted.");
      loadCategories();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Cannot delete category with children or products."
      );
    }
  };

  return (
    <PageContainer
      title="Category Hierarchy"
      description="Organize your product tree, taxonomy, and storefront navigation structure."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Category Listing ({categories.length})
            </CardTitle>
            <CardDescription>
              Categories can be nested to form sub-categories for navigation menus.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Display Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading categories...
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Folder className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium">No categories created yet</p>
                        <Button size="sm" variant="outline" onClick={handleOpenCreate}>
                          Create First Category
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => {
                    const parent = categories.find((c) => c.id === cat.parentId);
                    return (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {cat.parentId ? (
                              <>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-3" />
                                <Folder className="h-4 w-4 text-muted-foreground" />
                              </>
                            ) : (
                              <FolderPlus className="h-4 w-4 text-primary" />
                            )}
                            <span>{cat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {parent ? parent.name : "— Root Category —"}
                        </TableCell>
                        <TableCell>{cat.order}</TableCell>
                        <TableCell>
                          <Badge variant={cat.status === "active" ? "default" : "secondary"}>
                            {cat.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEdit(cat)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleDelete(cat)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Modify category details and parent hierarchy."
                : "Add a category to structure products."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                required
                placeholder="e.g. Footwear"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (Optional)</label>
              <Input
                placeholder="e.g. footwear"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Category</label>
              <Select
                value={parentId || "none"}
                onValueChange={(val) => setParentId(val === "none" ? "" : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-Level Category)</SelectItem>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingCategory ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
