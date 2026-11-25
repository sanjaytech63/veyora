"use client";

import * as React from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Package, Loader2 } from "lucide-react";

const shimmerSvg = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#33333315" offset="20%" />
      <stop stop-color="#33333330" offset="50%" />
      <stop stop-color="#33333315" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f4f4f5" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);

export const shimmerPlaceholder = `data:image/svg+xml;base64,${toBase64(shimmerSvg(600, 750))}`;

/**
 * Optimizes Cloudinary CDN URLs with modern auto-format and perceptual auto-quality
 */
export function getOptimizedImageUrl(
  src: string,
  options?: { width?: number; quality?: string }
): string {
  if (!src || typeof src !== "string") return src;

  if (src.includes("res.cloudinary.com") && src.includes("/image/upload/")) {
    const uploadIndex = src.indexOf("/image/upload/");
    if (uploadIndex !== -1) {
      const prefix = src.slice(0, uploadIndex + "/image/upload/".length);
      const rest = src.slice(uploadIndex + "/image/upload/".length);

      // Only add transformations if none exist yet in the immediate path segment
      if (!/^([a-z]_[^/]+,)*[a-z]_[^/]+\//.test(rest)) {
        const transforms = ["f_auto", options?.quality ? `q_${options.quality}` : "q_auto"];
        if (options?.width && options.width > 0) {
          transforms.push(`w_${Math.min(options.width * 2, 1920)}`, "c_limit");
        }
        return `${prefix}${transforms.join(",")}/${rest}`;
      }
    }
  }

  return src;
}

export interface OptimizedImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  containerClassName?: string;
  showFallbackIcon?: boolean;
  showLoader?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc,
  showFallbackIcon = true,
  showLoader = true,
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
        <div
          className={cn(
            "relative overflow-hidden",
            fill ? "h-full w-full" : undefined,
            containerClassName
          )}
        >
          {!loaded && showLoader && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10"
            >
              <Loader2
                className="h-4 w-4 animate-spin text-muted-foreground/60"
                aria-hidden="true"
              />
              <span className="sr-only">Loading fallback image...</span>
            </div>
          )}
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
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground",
          containerClassName
        )}
      >
        {showFallbackIcon && <Package className="h-6 w-6 opacity-40" aria-hidden="true" />}
      </div>
    );
  }

  const optimizedSrc =
    typeof src === "string"
      ? getOptimizedImageUrl(src, { width: typeof width === "number" ? width : undefined })
      : src;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "h-full w-full" : "inline-block",
        containerClassName
      )}
      style={!fill && width && height ? { width, height } : undefined}
    >
      {!loaded && showLoader && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-2xs z-10 pointer-events-none"
        >
          <Loader2
            className={cn(
              "animate-spin text-muted-foreground/60",
              fill || (width && Number(width) > 64) ? "h-6 w-6" : "h-4 w-4"
            )}
            aria-hidden="true"
          />
          <span className="sr-only">Loading image...</span>
        </div>
      )}
      <Image
        {...props}
        src={optimizedSrc}
        alt={alt || "Product image"}
        className={cn(
          "transition-all duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        fill={fill}
        width={!fill ? width || 600 : undefined}
        height={!fill ? height || 600 : undefined}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        priority={priority}
        placeholder={props.placeholder || (priority ? "empty" : "blur")}
        blurDataURL={props.blurDataURL || shimmerPlaceholder}
        onError={() => setError(true)}
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad?.(e);
        }}
      />
    </div>
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
