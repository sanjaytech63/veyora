"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Product, Category, Brand } from "@veyora/types";
import { UpdateProductInput } from "@veyora/validators";
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
  AlertTriangle,
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [product, setProduct] = React.useState<Product | null>(null);
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
  const [stock, setStock] = React.useState<number>(0);
  const [trackQuantity, setTrackQuantity] = React.useState(true);
  const [status, setStatus] = React.useState<"draft" | "active" | "archived">("active");
  const [categoryId, setCategoryId] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");

  // Images State
  const [images, setImages] = React.useState<ImageFormState[]>([]);

  // Variants State
  const [variants, setVariants] = React.useState<VariantFormState[]>([]);

  // SEO State
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");

  React.useEffect(() => {
    async function loadProductAndMetadata() {
      if (!productId) return;
      try {
        const [prod, catRes, brandRes] = await Promise.all([
          adminCatalogApi.getProduct(productId),
          adminCatalogApi.getCategories(),
          adminCatalogApi.getBrands(),
        ]);

        setProduct(prod);
        setCategories(catRes);
        setBrands(brandRes);

        // Populate fields
        setTitle(prod.title);
        setSlug(prod.slug);
        setDescription(prod.description);
        setPrice(prod.price);
        setCompareAtPrice(prod.compareAtPrice ?? "");
        setCostPrice(prod.costPrice ?? "");
        setSku(prod.sku);
        setBarcode(prod.barcode ?? "");
        setStock(prod.stock);
        setTrackQuantity(prod.trackQuantity);
        setStatus(prod.status);
        setCategoryId(prod.categoryId);
        setBrandId(prod.brandId || "");
        setTagsInput(prod.tags ? prod.tags.join(", ") : "");
        setImages(
          (prod.images || []).map((img, i) => ({
            url: img.url,
            alt: img.alt || "",
            isPrimary: img.isPrimary ?? (i === 0),
            order: img.order ?? i,
          }))
        );
        setVariants(
          (prod.variants || []).map((v) => ({
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            color: v.color,
            size: v.size,
            image: v.image,
          }))
        );
        setSeoTitle(prod.seo?.metaTitle || "");
        setSeoDescription(prod.seo?.metaDescription || "");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    loadProductAndMetadata();
  }, [productId]);

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

    setSaving(true);

    try {
      const payload: UpdateProductInput = {
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

      await adminCatalogApi.updateProduct(productId, payload);
      toast.success("Product updated successfully!");
      router.push("/products");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading Product" description="Please wait...">
        <div className="p-8 text-center text-muted-foreground">Loading product data...</div>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer title="Product Not Found" description="The requested product could not be located.">
        <div className="p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-muted-foreground">Product with ID {productId} does not exist.</p>
          <Button asChild>
            <Link href="/products">Return to Catalog</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit: ${product.title}`}
      description={`SKU: ${product.sku} • ID: ${product.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/products" className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Badge
            variant={
              status === "active" ? "default" : status === "draft" ? "secondary" : "outline"
            }
          >
            {status}
          </Badge>
        </div>
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (URL Path)</label>
                <Input
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
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Compare At Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
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
                <label className="text-sm font-medium">SKU *</label>
                <Input
                  required
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
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="editTrackQuantity"
                  checked={trackQuantity}
                  onCheckedChange={(checked) => setTrackQuantity(Boolean(checked))}
                />
                <Label htmlFor="editTrackQuantity" className="text-sm cursor-pointer">
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
                <Select value={brandId || "none"} onValueChange={(val) => setBrandId(val === "none" ? "" : val)}>
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
                  placeholder="https://images.example.com/photo.jpg"
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                  className="text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                No variants configured for this product.
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-muted/20">
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Title</label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Description</label>
              <Textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" asChild disabled={saving}>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
