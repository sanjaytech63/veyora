"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { catalogApi } from "@/lib/api/catalog-api";
import { Product, ProductVariant } from "@veyora/types";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Info,
  ChevronRight,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Gallery
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  // Variant Selection
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(null);

  React.useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await catalogApi.getProduct(slug);
        setProduct(data);
        if (data.variants && data.variants.length > 0 && data.variants[0]) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load product.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-12">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-24 w-full bg-muted rounded" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center">
        <Container size="sm">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The product you are looking for is either unpublished, discontinued, or does not exist.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Browse All Products
            </Link>
          </Button>
        </Container>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isDiscounted =
    product.compareAtPrice && product.compareAtPrice > currentPrice;

  const images = product.images || [];
  const activeImage = images[selectedImageIndex]?.url || images[0]?.url;

  return (
    <div className="py-8 md:py-12">
      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="hover:text-foreground cursor-default">
                {product.category.name}
              </span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          {/* 1. Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted flex items-center justify-center">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <Package className="h-20 w-20 text-muted-foreground/30" />
              )}

              {isDiscounted && (
                <Badge
                  variant="destructive"
                  className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider"
                >
                  Sale
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === idx
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Product image ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Right: Product Details & Variant Options */}
          <div className="flex flex-col space-y-6">
            <div>
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1 block">
                  {product.brand.name}
                </span>
              )}
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {product.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                SKU: {currentSku}
              </p>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                ${currentPrice.toFixed(2)}
              </span>
              {isDiscounted && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.compareAtPrice?.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    Save $
                    {((product.compareAtPrice || 0) - currentPrice).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2">
              {currentStock > 0 ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>In Stock ({currentStock} available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm font-medium text-rose-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Out of Stock</span>
                </div>
              )}
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <label className="text-sm font-semibold text-foreground">
                  Select Variant:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?.sku === variant.sku;
                    const variantLabel = [
                      variant.color,
                      variant.size,
                    ]
                      .filter(Boolean)
                      .join(" / ") || variant.sku;

                    return (
                      <button
                        key={variant.sku}
                        onClick={() => setSelectedVariant(variant)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20"
                            : "border-input hover:border-foreground/40 text-muted-foreground"
                        }`}
                      >
                        <div>{variantLabel}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          ${variant.price.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 pt-2 border-t">
              <h3 className="text-sm font-semibold text-foreground">About this product</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Informational Banner for Phase Boundaries */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary flex items-start gap-3">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Veyora E-Commerce Architecture</span>
                Catalog browsing, variant resolution, and live stock tracking are fully functional. Shopping cart, order persistence, and payment gateways will be implemented in subsequent development phases.
              </div>
            </div>

            {/* Attributes / Specifications */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="pt-2 border-t space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Specifications</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {product.attributes.map((attr, idx) => (
                    <div key={idx} className="rounded-md border p-2 bg-muted/20">
                      <span className="text-muted-foreground block font-medium">
                        {attr.name}
                      </span>
                      <span className="text-foreground font-semibold">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Value Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-4 w-4 text-primary" />
                <span>Fast Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Authentic Guarantee</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
