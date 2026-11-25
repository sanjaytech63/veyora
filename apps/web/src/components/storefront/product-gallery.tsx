"use client";

import * as React from "react";
import { ProductImage as ProductImageType } from "@veyora/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ProductGalleryProps {
  images: ProductImageType[];
  title: string;
  selectedVariantImage?: string;
  className?: string;
}

export function ProductGallery({
  images,
  title,
  selectedVariantImage,
  className,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  // If a variant specifies a special image, locate or set it
  React.useEffect(() => {
    if (selectedVariantImage) {
      const idx = images.findIndex((img) => img.url === selectedVariantImage);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }, [selectedVariantImage, images]);

  const allImages = images.length > 0 ? images : [{ url: "", alt: title, order: 0 }];
  const currentImage = allImages[activeIndex] || allImages[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Main Display Stage */}
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-xs"
        role="region"
        aria-roledescription="carousel"
        aria-label="Product image gallery"
      >
        {currentImage?.url ? (
          <OptimizedImage
            src={currentImage.url}
            alt={currentImage.alt || title}
            fill
            priority
            className="object-cover object-center transition-all duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground">
            <span className="text-sm font-medium">{title}</span>
          </div>
        )}

        {/* Floating Zoom / Expand Icon Hint */}
        <div className="absolute right-4 top-4 rounded-full bg-background/80 p-2 text-foreground/70 backdrop-blur-md transition-opacity opacity-0 group-hover:opacity-100 shadow-xs pointer-events-none">
          <Maximize2 className="h-4 w-4" />
        </div>

        {/* Carousel Arrows (if > 1 image) */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image index indicator pill */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold backdrop-blur-md border border-border/40 shadow-xs text-foreground/80 pointer-events-none">
            {activeIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {allImages.map((img, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1} of ${allImages.length}`}
              aria-current={activeIndex === idx ? "true" : undefined}
              className={cn(
                "relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border p-0 transition-all",
                activeIndex === idx
                  ? "border-primary ring-2 ring-primary/30 opacity-100 scale-95"
                  : "border-border/60 opacity-60 hover:opacity-100"
              )}
            >
              <OptimizedImage
                src={img.url}
                alt={img.alt || `${title} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
