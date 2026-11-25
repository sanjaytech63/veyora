"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "@veyora/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { StockBadge } from "@/components/storefront/stock-badge";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ProductReviews } from "@/components/storefront/product-reviews";
import { useRelatedProducts, useCategories } from "@/hooks/use-catalog";
import { useUIStore } from "@/stores/ui-store";
import { useCart } from "@/lib/hooks/use-cart";
import { notifyWarning } from "@/lib/notifications";
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
  MapPin,
  Zap,
  Ruler,
  Leaf,
  Layers,
  Shirt,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";

interface ProductDetailsClientProps {
  initialProduct: Product;
}

export function ProductDetailsClient({ initialProduct }: ProductDetailsClientProps) {
  const router = useRouter();
  const { setCartDrawerOpen } = useUIStore();
  const { addToCartAsync, isAddingToCart } = useCart();
  const { data: categories = [] } = useCategories();
  const [product] = React.useState<Product>(initialProduct);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    product.variants?.find((variant) => variant.stock > 0) || product.variants?.[0] || null
  );
  const [quantity, setQuantity] = React.useState(1);
  const [addedSuccess, setAddedSuccess] = React.useState(false);
  const [pincode, setPincode] = React.useState("");
  const [pincodeStatus, setPincodeStatus] = React.useState<
    "idle" | "loading" | "invalid" | "unavailable"
  >("idle");

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentCompareAt = product.compareAtPrice;
  const currentSku = selectedVariant?.sku ?? product.sku;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isDiscounted = typeof currentCompareAt === "number" && currentCompareAt > currentPrice;
  const discountPercent = isDiscounted
    ? Math.round(((currentCompareAt - currentPrice) / currentCompareAt) * 100)
    : 0;

  const { data: relatedProducts = [], isLoading: relatedLoading } = useRelatedProducts(
    product.id,
    product.categoryId,
    4
  );

  const categoryName =
    categories.find((category) => category.id === product.categoryId)?.name ||
    product.category?.name ||
    "Catalog";

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const variantId = selectedVariant
    ? (selectedVariant as unknown as { _id?: string })._id?.toString() ||
      selectedVariant.sku ||
      undefined
    : undefined;

  const prepareCartItem = async () => {
    if (currentStock <= 0) {
      notifyWarning("This item is currently out of stock.");
      return false;
    }
    await addToCartAsync({
      productId: product.id,
      quantity,
      variantId,
    });
    return true;
  };

  const handleAddToCart = async () => {
    try {
      const prepared = await prepareCartItem();
      if (!prepared) return;
      setAddedSuccess(true);
      setCartDrawerOpen(true);
      window.setTimeout(() => setAddedSuccess(false), 2500);
    } catch {
      // Existing mutation handles API error feedback.
    }
  };

  const handleBuyNow = async () => {
    try {
      const prepared = await prepareCartItem();
      if (prepared) router.push("/checkout");
    } catch {
      // Existing mutation handles API error feedback.
    }
  };

  const handlePincodeCheck = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setPincodeStatus("invalid");
      return;
    }
    setPincodeStatus("loading");
    window.setTimeout(() => setPincodeStatus("unavailable"), 350);
  };

  return (
    <div className="pb-24 md:pb-12">
      <Container size="xl" className="py-5 md:py-7">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-1.5 overflow-hidden text-[11px] text-muted-foreground"
        >
          <Link href="/" className="shrink-0 transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/shop" className="shrink-0 transition-colors hover:text-foreground">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {product.category ? (
            <>
              <Link
                href={`/category/${product.category.slug}`}
                className="max-w-28 shrink-0 truncate transition-colors hover:text-foreground"
              >
                {categoryName}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          ) : null}
          <span className="truncate font-medium text-foreground">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(420px,1.1fr)_minmax(300px,.82fr)_280px] xl:grid-cols-[minmax(480px,1.2fr)_minmax(330px,.85fr)_300px]">
          <ProductGallery
            images={product.images || []}
            title={product.title}
            selectedVariantImage={selectedVariant?.image}
            className="lg:sticky lg:top-24"
          />

          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {product.tags?.some((tag) => tag.toLowerCase().includes("bestseller")) ? (
                <Badge className="rounded-sm px-2 py-1 text-[9px] uppercase">Bestseller</Badge>
              ) : null}
              {product.tags?.some((tag) => tag.toLowerCase().includes("new")) ? (
                <Badge variant="outline" className="rounded-sm px-2 py-1 text-[9px] uppercase">
                  New Arrival
                </Badge>
              ) : null}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {categoryName}
              </p>
              <h1 className="mt-2 text-[27px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
                {product.title}
              </h1>
              {product.description ? (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {product.description}
                </p>
              ) : null}
            </div>

            {typeof product.averageRating === "number" && product.averageRating > 0 ? (
              <a
                href="#reviews-section"
                className="flex items-center gap-2 text-xs text-foreground"
              >
                <span className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        index < Math.round(product.averageRating ?? 0)
                          ? "h-3.5 w-3.5 fill-current"
                          : "h-3.5 w-3.5 text-muted"
                      }
                    />
                  ))}
                </span>
                <strong>{product.averageRating.toFixed(1)}</strong>
                <span className="text-muted-foreground">({product.reviewCount ?? 0} reviews)</span>
              </a>
            ) : null}

            <div className="flex items-baseline gap-2 border-b border-border/70 pb-5">
              <span className="text-[28px] font-bold tracking-tight text-foreground">
                {formatPrice(currentPrice)}
              </span>
              {isDiscounted ? (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(currentCompareAt)}
                  </span>
                  <Badge variant="destructive" className="rounded-sm px-2 py-1 text-[10px]">
                    {discountPercent}% OFF
                  </Badge>
                </>
              ) : null}
            </div>

            {product.variants?.length ? (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onSelectVariant={(variant) => {
                  setSelectedVariant(variant);
                  if (quantity > variant.stock && variant.stock > 0) setQuantity(variant.stock);
                }}
              />
            ) : null}

            <div className="flex items-center justify-between">
              <StockBadge
                stock={currentStock}
                trackQuantity={product.trackQuantity}
                showTextDetail
              />
              <span className="text-[10px] text-muted-foreground">SKU: {currentSku}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-11 items-center rounded-md border border-border/80 bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-10 rounded-none"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1 || currentStock <= 0}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-9 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-10 rounded-none"
                  onClick={() => setQuantity((value) => Math.min(currentStock || 99, value + 1))}
                  disabled={
                    currentStock <= 0 || (product.trackQuantity && quantity >= currentStock)
                  }
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <WishlistButton
                productId={product.id}
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="h-12 rounded-md text-xs font-semibold"
                disabled={currentStock <= 0 || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : addedSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {addedSuccess ? "Added" : "Add to Cart"}
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-md text-xs font-semibold"
                disabled={currentStock <= 0 || isAddingToCart}
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </Button>
            </div>

            <div className="grid grid-cols-3 border-y border-border/70 py-3">
              {[
                { icon: Truck, title: "Shipping", text: "At checkout" },
                { icon: RotateCcw, title: "Returns", text: "Policy applies" },
                { icon: ShieldCheck, title: "Payment", text: "Secure checkout" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-2 px-2 first:pl-0">
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] font-semibold text-foreground">{item.title}</p>
                    <p className="text-[9px] text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <form
              onSubmit={handlePincodeCheck}
              className="rounded-md border border-border/70 bg-card p-4"
            >
              <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Check Delivery
              </h2>
              <div className="mt-3 flex gap-2">
                <label htmlFor="product-pincode" className="sr-only">
                  Indian delivery pincode
                </label>
                <Input
                  id="product-pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(event) =>
                    setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter pincode"
                  className="h-10 text-xs"
                  aria-invalid={pincodeStatus === "invalid"}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0 rounded-md px-3 text-xs"
                  disabled={pincodeStatus === "loading"}
                >
                  {pincodeStatus === "loading" ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
              </div>
              {pincodeStatus === "invalid" ? (
                <p role="alert" className="mt-2 text-[10px] text-destructive">
                  Enter a valid 6-digit Indian pincode.
                </p>
              ) : null}
              {pincodeStatus === "unavailable" ? (
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Delivery estimates are not available from a connected service yet.
                </p>
              ) : null}
            </form>

            <section className="rounded-md border border-border/70 bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-foreground">You May Also Like</h2>
                {relatedProducts.length > 1 ? (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                ) : null}
              </div>
              {relatedLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map((item) => (
                    <div key={item} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : relatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {relatedProducts.slice(0, 2).map((related) => (
                    <Link
                      key={related.id}
                      href={`/products/${related.slug}`}
                      className="group min-w-0"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                        {related.images?.[0]?.url ? (
                          <OptimizedImage
                            src={related.images[0].url}
                            alt={related.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            sizes="140px"
                          />
                        ) : null}
                        <WishlistButton
                          productId={related.id}
                          className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full border border-white/30 bg-black/35 text-white"
                        />
                      </div>
                      <p className="mt-2 truncate text-[10px] font-semibold text-foreground">
                        {related.title}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-foreground">
                        {formatPrice(related.price)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] leading-4 text-muted-foreground">
                  No related products are available.
                </p>
              )}
            </section>
          </aside>
        </div>

        <section className="mt-10 border-t border-border/70 pt-6" id="reviews-section">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0">
              {[
                ["description", "Description"],
                ["fabric", "Fabric & Material"],
                ["size", "Size Guide"],
                ["care", "Care Instructions"],
                ["reviews", `Reviews (${product.reviewCount ?? 0})`],
              ].map((tab) => {
                const [value, label] = tab as [string, string];
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-11 shrink-0 rounded-none border-b-2 border-transparent px-4 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                  >
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent
              value="description"
              className="pt-5 text-sm leading-6 text-muted-foreground"
            >
              {product.description || "Product description is not available."}
              <p className="mt-3 text-xs font-medium text-foreground">Variant SKU: {currentSku}</p>
            </TabsContent>
            <TabsContent value="fabric" className="pt-5">
              {product.attributes?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.attributes.map((attribute) => (
                    <div
                      key={`${attribute.name}-${attribute.value}`}
                      className="rounded-md border border-border/70 p-3 text-xs"
                    >
                      <span className="text-muted-foreground">{attribute.name}</span>
                      <p className="mt-1 font-semibold text-foreground">{attribute.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fabric and material details are not available for this product.
                </p>
              )}
            </TabsContent>
            <TabsContent value="size" className="pt-5 text-sm text-muted-foreground">
              Available garment sizes are listed in the size and fit control above. Brand-specific
              measurement data has not been supplied.
            </TabsContent>
            <TabsContent value="care" className="pt-5 text-sm text-muted-foreground">
              Follow the care label supplied with the garment. Delicate and embroidered fabrics may
              require professional dry cleaning.
            </TabsContent>
            <TabsContent value="reviews" className="pt-5">
              <ProductReviews productId={product.id} productTitle={product.title} />
            </TabsContent>
          </Tabs>
        </section>

        <section className="mt-6 grid grid-cols-2 border-y border-border/70 sm:grid-cols-4">
          {[
            { icon: Leaf, title: "Fabric", value: "Not supplied" },
            { icon: Layers, title: "Pattern", value: "Not supplied" },
            { icon: Shirt, title: "Fit", value: "Not supplied" },
            { icon: Ruler, title: "Length", value: "Not supplied" },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`flex items-center gap-3 px-3 py-4 ${
                index % 2 === 1 ? "border-l border-border/70" : ""
              } sm:border-l sm:first:border-l-0`}
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </section>
      </Container>

      <div className="fixed inset-x-0 bottom-[56px] z-30 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-20">
            <p className="text-[9px] text-muted-foreground">Total</p>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(currentPrice * quantity)}
            </p>
          </div>
          <Button
            className="h-11 flex-1 rounded-md text-xs font-semibold"
            disabled={currentStock <= 0 || isAddingToCart}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
