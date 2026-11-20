"use client";

import * as React from "react";
import Link from "next/link";
import { Product, ProductVariant } from "@veyora/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { StockBadge } from "@/components/storefront/stock-badge";
import { ProductAccordion } from "@/components/storefront/product-accordion";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/storefront/json-ld";
import { useRelatedProducts, useCategories } from "@/hooks/use-catalog";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Check,
} from "lucide-react";

interface ProductDetailsClientProps {
  initialProduct: Product;
}

export function ProductDetailsClient({ initialProduct }: ProductDetailsClientProps) {
  const { setCartDrawerOpen } = useUIStore();
  const { data: categories = [] } = useCategories();
  const [product] = React.useState<Product>(initialProduct);

  // Selected variant
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 && product.variants[0]
      ? product.variants[0]
      : null
  );

  // Quantity stepper
  const [quantity, setQuantity] = React.useState(1);
  const [isAdding, setIsAdding] = React.useState(false);
  const [addedSuccess, setAddedSuccess] = React.useState(false);

  // Active pricing and stock
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentCompareAt = product.compareAtPrice;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const isDiscounted = currentCompareAt && currentCompareAt > currentPrice;
  const discountPercent = isDiscounted
    ? Math.round(((currentCompareAt! - currentPrice) / currentCompareAt!) * 100)
    : 0;

  // Related products query
  const { data: relatedProducts = [], isLoading: relatedLoading } = useRelatedProducts(
    product.id,
    product.categoryId,
    4
  );

  const categoryName = React.useMemo(() => {
    return categories.find((c) => c.id === product.categoryId)?.name || "Atelier Hardware";
  }, [categories, product.categoryId]);

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      toast.error("This item is currently out of stock.");
      return;
    }

    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      setAddedSuccess(true);
      toast.success("Added to Bag", {
        description: `${quantity}x ${product.title}${
          selectedVariant ? ` (${selectedVariant.color || selectedVariant.size})` : ""
        }`,
      });
      setCartDrawerOpen(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    }, 400);
  };

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: categoryName, url: `/category/${product.categoryId}` },
    { name: product.title, url: `/products/${product.slug}` },
  ];

  return (
    <div className="py-8 md:py-12 space-y-16">
      {/* JSON-LD Schemas for Rich Snippets */}
      <ProductJsonLd product={product} url={`/products/${product.slug}`} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <Container size="xl" className="space-y-12">
        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-muted-foreground">{categoryName}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </nav>

        {/* Product Details Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Image Gallery Stage */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <ProductGallery
              images={product.images || []}
              title={product.title}
              selectedVariantImage={selectedVariant?.image}
            />
          </div>

          {/* Right Column: Buying Stage & Details */}
          <div className="lg:col-span-5 space-y-8">
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {categoryName}
                </span>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold">4.9</span>
                  <span className="text-xs text-muted-foreground">(48 reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {isDiscounted && (
                    <span className="text-base text-muted-foreground line-through">
                      ${currentCompareAt!.toFixed(2)}
                    </span>
                  )}
                </div>

                {isDiscounted && (
                  <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    Save {discountPercent}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Live Stock Status Indicator */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Availability</span>
              <StockBadge stock={currentStock} trackQuantity={product.trackQuantity} showTextDetail={true} />
            </div>

            {/* Interactive Variant Selectors */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onSelectVariant={(v) => {
                  setSelectedVariant(v);
                  if (quantity > v.stock && v.stock > 0) {
                    setQuantity(v.stock);
                  }
                }}
              />
            )}

            {/* Quantity Selector & Add to Bag */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center rounded-2xl border border-border/80 bg-card p-1 shadow-xs">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || currentStock <= 0}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-12 text-center text-sm font-bold text-foreground">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}
                    disabled={currentStock <= 0 || (product.trackQuantity && quantity >= currentStock)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Primary Add Button */}
                <Button
                  size="lg"
                  className="flex-1 rounded-2xl font-bold text-sm shadow-md shadow-primary/10 gap-2 h-12"
                  disabled={currentStock <= 0 || isAdding}
                  onClick={handleAddToCart}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added to Bag
                    </>
                  ) : currentStock <= 0 ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Add to Bag • ${(currentPrice * quantity).toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Value Proposition Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
              <div className="p-2 space-y-1">
                <Truck className="h-4 w-4 mx-auto text-primary" />
                <p className="font-semibold text-foreground text-[11px]">Same-Day Dispatch</p>
                <p className="text-[10px]">Free over $150</p>
              </div>
              <div className="p-2 space-y-1">
                <ShieldCheck className="h-4 w-4 mx-auto text-primary" />
                <p className="font-semibold text-foreground text-[11px]">2-Year Warranty</p>
                <p className="text-[10px]">Atelier backed</p>
              </div>
              <div className="p-2 space-y-1">
                <RotateCcw className="h-4 w-4 mx-auto text-primary" />
                <p className="font-semibold text-foreground text-[11px]">30-Day Returns</p>
                <p className="text-[10px]">Risk-free trial</p>
              </div>
            </div>

            {/* Product Accordion (Specs, Shipping, Materials) */}
            <ProductAccordion
              attributes={product.attributes || []}
              sku={currentSku}
            />
          </div>
        </div>

        {/* Related Products Recommendation Grid */}
        {relatedProducts.length > 0 && (
          <section className="space-y-8 pt-12 border-t border-border/60">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Complementary Gear
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                You May Also Admire
              </h2>
            </div>

            <ProductGrid
              products={relatedProducts}
              categories={categories}
              loading={relatedLoading}
              columns={4}
            />
          </section>
        )}
      </Container>
    </div>
  );
}
