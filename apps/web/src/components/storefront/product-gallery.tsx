"use client";

import * as React from "react";
import { ProductImage as ProductImageType } from "@veyora/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const touchStart = React.useRef<number | null>(null);

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
    <div className={cn("grid grid-cols-1 gap-3 lg:grid-cols-[74px_minmax(0,1fr)]", className)}>
      {allImages.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-y-auto">
          {allImages.map((img, idx) => (
            <Button
              key={`${img.url}-${idx}`}
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1} of ${allImages.length}`}
              aria-current={activeIndex === idx ? "true" : undefined}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border p-0 transition-all lg:h-[74px] lg:w-[74px]",
                activeIndex === idx
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border/70 opacity-75 hover:opacity-100"
              )}
            >
              {img.url ? (
                <OptimizedImage
                  src={img.url}
                  alt={img.alt || `${title} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="74px"
                  showLoader={false}
                />
              ) : null}
            </Button>
          ))}
        </div>
      )}

      <div
        className="order-1 relative aspect-[4/5] w-full overflow-hidden rounded-md border border-border/70 bg-muted/30 lg:order-2"
        role="region"
        aria-roledescription="carousel"
        aria-label="Product image gallery"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const end = event.changedTouches[0]?.clientX ?? touchStart.current;
          const distance = end - touchStart.current;
          if (Math.abs(distance) > 45) {
            if (distance > 0) handlePrev();
            else handleNext();
          }
          touchStart.current = null;
        }}
      >
        {currentImage?.url ? (
          <OptimizedImage
            src={currentImage.url}
            alt={currentImage.alt || title}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 44vw"
            showLoader={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground">
            <span className="text-sm font-medium">{title}</span>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setZoomOpen(true)}
          className="absolute right-3 top-3 h-9 w-9 rounded-full border border-border/70 bg-background/90 text-foreground backdrop-blur-sm"
          aria-label="Open fullscreen product image"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

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

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="h-[90vh] max-w-5xl overflow-hidden p-2 sm:p-3">
          <DialogTitle className="sr-only">{title} image viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Full-size product image viewer with previous and next controls.
          </DialogDescription>
          {currentImage?.url ? (
            <div className="relative h-full w-full overflow-hidden rounded-md bg-muted">
              <OptimizedImage
                src={currentImage.url}
                alt={currentImage.alt || title}
                fill
                className="object-contain"
                sizes="100vw"
                showLoader={false}
              />
              {allImages.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-background/90"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-background/90"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
