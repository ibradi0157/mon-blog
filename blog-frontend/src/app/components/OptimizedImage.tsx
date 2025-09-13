"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toAbsoluteImageUrl, buildSrcSet } from "../lib/api";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  thumbnails?: string[];
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  thumbnails,
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  placeholder = "empty",
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Generate optimized src and srcSet
  useEffect(() => {
    if (src) {
      setCurrentSrc(toAbsoluteImageUrl(src) || null);
    } else if (thumbnails && thumbnails.length > 0) {
      // Use the largest thumbnail as fallback
      const largest = thumbnails.reduce((prev, current) => {
        const prevWidth = parseInt(prev.match(/-(\d+)w\./)?.[1] || "0");
        const currentWidth = parseInt(current.match(/-(\d+)w\./)?.[1] || "0");
        return currentWidth > prevWidth ? current : prev;
      });
      setCurrentSrc(toAbsoluteImageUrl(largest) || null);
    }
  }, [src, thumbnails]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? "100vw"
      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  );

  // Generate blur placeholder
  const generateBlurDataURL = (width: number = 10, height: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f1f5f9');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL();
  };

  // Fallback image
  if (imageError || !currentSrc) {
    return (
      <div 
        className={`bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <svg
          className="w-8 h-8 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading && placeholder === "blur") {
    return (
      <div 
        className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 ${className}`}
        style={fill ? undefined : { width, height }}
      />
    );
  }

  const imageProps = {
    src: currentSrc,
    alt,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    sizes: responsiveSizes,
    placeholder: placeholder as any,
    blurDataURL: blurDataURL || (placeholder === "blur" ? generateBlurDataURL() : undefined),
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width || 800}
      height={height || 600}
    />
  );
}

// Progressive image loading hook
export function useProgressiveImage(src?: string | null, thumbnails?: string[]) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src && (!thumbnails || thumbnails.length === 0)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    // Start with low quality thumbnail if available
    if (thumbnails && thumbnails.length > 0) {
      const smallest = thumbnails.reduce((prev, current) => {
        const prevWidth = parseInt(prev.match(/-(\d+)w\./)?.[1] || "999999");
        const currentWidth = parseInt(current.match(/-(\d+)w\./)?.[1] || "999999");
        return currentWidth < prevWidth ? current : prev;
      });
      setCurrentSrc(toAbsoluteImageUrl(smallest) || null);
    }

    // Load high quality image
    const img = new window.Image();
    img.onload = () => {
      setCurrentSrc(toAbsoluteImageUrl(src) || null);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
    
    if (src) {
      img.src = toAbsoluteImageUrl(src) || '';
    }
  }, [src, thumbnails]);

  return { currentSrc, isLoading, error };
}

// Image preloader utility
export class ImagePreloader {
  private static cache = new Set<string>();
  private static loading = new Set<string>();

  static async preload(src: string): Promise<void> {
    const absoluteSrc = toAbsoluteImageUrl(src);
    if (!absoluteSrc || this.cache.has(absoluteSrc) || this.loading.has(absoluteSrc)) {
      return;
    }

    this.loading.add(absoluteSrc);

    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        this.cache.add(absoluteSrc);
        this.loading.delete(absoluteSrc);
        resolve();
      };
      img.onerror = () => {
        this.loading.delete(absoluteSrc);
        reject();
      };
      img.src = absoluteSrc;
    });
  }

  static preloadMultiple(sources: string[]): Promise<void[]> {
    return Promise.allSettled(sources.map(src => this.preload(src))) as unknown as Promise<void[]>;
  }

  static isPreloaded(src: string): boolean {
    const absoluteSrc = toAbsoluteImageUrl(src);
    return absoluteSrc ? this.cache.has(absoluteSrc) : false;
  }

  static clear(): void {
    this.cache.clear();
    this.loading.clear();
  }
}
