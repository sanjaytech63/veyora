"use client";

import * as React from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export interface OptimizedImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  containerClassName?: string;
  showFallbackIcon?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc,
  showFallbackIcon = true,
  fill,
  width,
  height,
  sizes,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const isInvalid = !src || error;

  if (isInvalid) {
    if (fallbackSrc) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt || "Image preview"}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          fill={fill}
          width={!fill ? width || 400 : undefined}
          height={!fill ? height || 400 : undefined}
          sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          onLoad={() => setLoaded(true)}
          {...props}
        />
      );
    }

    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground",
          containerClassName
        )}
      >
        {showFallbackIcon && <Package className="h-6 w-6 opacity-40" />}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Product image"}
      className={cn("transition-all duration-300", loaded ? "opacity-100" : "opacity-0", className)}
      fill={fill}
      width={!fill ? width || 600 : undefined}
      height={!fill ? height || 600 : undefined}
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      priority={priority}
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
}

export function ProductImage({
  src,
  alt,
  aspectRatio = "aspect-[4/5]",
  className,
  containerClassName,
  ...props
}: OptimizedImageProps & { aspectRatio?: string }) {
  return (
    <div
      className={cn("relative w-full overflow-hidden bg-muted/30", aspectRatio, containerClassName)}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className={cn("object-cover object-center", className)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        {...props}
      />
    </div>
  );
}
