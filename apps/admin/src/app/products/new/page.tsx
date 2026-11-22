"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminCatalogApi } from "@/lib/api/admin-catalog-api";
import { Category, Brand } from "@veyora/types";
import { CreateProductInput } from "@veyora/validators";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Save,
} from "lucide-react";

interface VariantFormState {
  size?: string;
  color?: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
}

interface ImageFormState {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);

  // Form State
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState<number | "">("");
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | "">("");
  const [costPrice, setCostPrice] = React.useState<number | "">("");
  const [sku, setSku] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [stock, setStock] = React.useState<number>(10);
  const [trackQuantity, setTrackQuantity] = React.useState(true);
  const [status, setStatus] = React.useState<"draft" | "active" | "archived">("active");
  const [categoryId, setCategoryId] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");

  // Images State
  const [images, setImages] = React.useState<ImageFormState[]>([
    { url: "", alt: "", isPrimary: true, order: 0 },
  ]);

  // Variants State
  const [variants, setVariants] = React.useState<VariantFormState[]>([]);

  // SEO State
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");

  React.useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          adminCatalogApi.getCategories(),
          adminCatalogApi.getBrands(),
        ]);
        setCategories(catRes);
        if (catRes.length > 0 && catRes[0]) {
          setCategoryId(catRes[0].id);
        }
        setBrands(brandRes);
      } catch {
        // Fallback
      }
    }
    loadMeta();
  }, []);

  const handleAddImage = () => {
    setImages((prev) => [
      ...prev,
      { url: "", alt: "", isPrimary: prev.length === 0, order: prev.length },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: `${sku ? sku + "-" : "VAR-"}${prev.length + 1}`,
        price: typeof price === "number" ? price : 0,
        stock: 5,
        color: "Black",
        size: "M",
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Product title is required.");
      return;
    }
    if (!sku.trim()) {
      toast.error("Product SKU is required.");
      return;
    }
    if (typeof price !== "number" || price < 0) {
      toast.error("Valid product price is required.");
      return;
    }
    if (!categoryId) {
      toast.error("Category must be selected.");
      return;
    }

    setLoading(true);

    try {
      const payload: CreateProductInput = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        price: Number(price),
        compareAtPrice: typeof compareAtPrice === "number" ? compareAtPrice : undefined,
        costPrice: typeof costPrice === "number" ? costPrice : undefined,
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        stock: Number(stock),
        trackQuantity,
        status,
        categoryId,
        brandId: brandId || undefined,
        tags: tagsInput
          ? tagsInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        images: images
          .filter((img) => img.url.trim() !== "")
          .map((img, i) => ({
            url: img.url.trim(),
            alt: img.alt.trim() || title,
            isPrimary: img.isPrimary,
            order: i,
          })),
        variants: variants.map((v) => ({
          sku: v.sku.toUpperCase().trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          color: v.color || undefined,
          size: v.size || undefined,
          image: v.image || undefined,
        })),
        seo: {
          metaTitle: seoTitle.trim() || undefined,
          metaDescription: seoDescription.trim() || undefined,
        },
      };

      await adminCatalogApi.createProduct(payload);
      toast.success("Product created successfully!");
      router.push("/products");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Create New Product"
      description="Add a new catalog item with pricing, images, inventory, and variants."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/products" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Core product identifiers and customer description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Title *</label>
                <Input
                  required
                  placeholder="e.g. Classic Oxford Cotton Shirt"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (Optional URL path)</label>
                <Input
                  placeholder="e.g. classic-oxford-cotton-shirt"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                required
                rows={4}
                placeholder="Detailed description of features, materials, and specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Price ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="99.99"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Compare At Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="129.99 (Optional strike-through)"
                  value={compareAtPrice}
                  onChange={(e) =>
                    setCompareAtPrice(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="45.00 (Private margin calculation)"
                  value={costPrice}
                  onChange={(e) =>
                    setCostPrice(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory & SKU
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU (Stock Keeping Unit) *</label>
                <Input
                  required
                  placeholder="e.g. SHIRT-OXF-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode / EAN</label>
                <Input
                  placeholder="Optional barcode number"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="trackQuantity"
                  checked={trackQuantity}
                  onCheckedChange={(checked) => setTrackQuantity(Boolean(checked))}
                />
                <Label htmlFor="trackQuantity" className="text-sm cursor-pointer">
                  Track stock quantity automatically
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization & Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Organization & Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand (Optional)</label>
                <Select
                  value={brandId || "none"}
                  onValueChange={(val) => setBrandId(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No brand</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as "active" | "draft" | "archived")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Published)</SelectItem>
                    <SelectItem value="draft">Draft (Unpublished)</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (Comma-separated)</label>
              <Input
                placeholder="summer, cotton, best-seller, trending"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Product Images
              </CardTitle>
              <CardDescription>Add image URLs for customer display</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddImage}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Image
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {images.map((img, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  placeholder="https://images.example.com/product-photo.jpg"
                  value={img.url}
                  onChange={(e) =>
                    setImages(
                      images.map((item, idx) =>
                        idx === index ? { ...item, url: e.target.value } : item
                      )
                    )
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Alt text"
                  value={img.alt}
                  onChange={(e) =>
                    setImages(
                      images.map((item, idx) =>
                        idx === index ? { ...item, alt: e.target.value } : item
                      )
                    )
                  }
                  className="w-48"
                />
                <Button
                  type="button"
                  variant={img.isPrimary ? "default" : "outline"}
                  size="sm"
                  className="h-9 text-xs shrink-0"
                  onClick={() => {
                    setImages(
                      images.map((item, i) => ({
                        ...item,
                        isPrimary: i === index,
                      }))
                    );
                  }}
                >
                  {img.isPrimary ? "Primary Cover" : "Set Cover"}
                </Button>
                {images.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    className="text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Product Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Product Variants
              </CardTitle>
              <CardDescription>Configure sizes, colors, and unique SKUs</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent>
            {variants.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No variants added. This product will be sold as a single standard item.
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-muted/20"
                  >
                    <Input
                      placeholder="Variant SKU"
                      value={v.sku}
                      onChange={(e) =>
                        setVariants(
                          variants.map((item, idx) =>
                            idx === i ? { ...item, sku: e.target.value } : item
                          )
                        )
                      }
                      className="w-36 font-mono text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) =>
                        setVariants(
                          variants.map((item, idx) =>
                            idx === i ? { ...item, price: parseFloat(e.target.value) || 0 } : item
                          )
                        )
                      }
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Stock"
                      value={v.stock}
                      onChange={(e) =>
                        setVariants(
                          variants.map((item, idx) =>
                            idx === i ? { ...item, stock: parseInt(e.target.value) || 0 } : item
                          )
                        )
                      }
                      className="w-20"
                    />
                    <Input
                      placeholder="Color"
                      value={v.color || ""}
                      onChange={(e) =>
                        setVariants(
                          variants.map((item, idx) =>
                            idx === i ? { ...item, color: e.target.value } : item
                          )
                        )
                      }
                      className="w-24"
                    />
                    <Input
                      placeholder="Size"
                      value={v.size || ""}
                      onChange={(e) =>
                        setVariants(
                          variants.map((item, idx) =>
                            idx === i ? { ...item, size: e.target.value } : item
                          )
                        )
                      }
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariant(i)}
                      className="text-destructive h-8 w-8 p-0 ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Search Engine Optimization (SEO)</CardTitle>
            <CardDescription>Improve visibility in search engine index pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Title</label>
              <Input
                placeholder="Product title for browser tab and search results"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Description</label>
              <Textarea
                rows={2}
                placeholder="Concise 160-character summary for search results"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" asChild disabled={loading}>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving Product..." : "Create Product"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
