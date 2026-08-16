"use client";

import { useState } from "react";
import { ProductImage } from "@/components/products/product-image";
import { cn } from "@/lib/utils";
import type { ProductImage as ProductImageDto } from "@/lib/api";

interface ProductGalleryProps {
  images: ProductImageDto[];
  productName: string;
}

// Each uploaded photo produces one file per variant (Original/Medium/Large/Thumbnail).
// Picking a single preferred variant type gives one gallery entry per distinct photo.
function selectGalleryImages(images: ProductImageDto[]): ProductImageDto[] {
  const preferenceOrder = ["Large", "Original", "Medium", "Thumbnail"];

  for (const type of preferenceOrder) {
    const matches = images.filter((img) => img.type === type);
    if (matches.length > 0) {
      return [...matches].sort((a, b) => a.displayOrder - b.displayOrder);
    }
  }

  return images;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = selectGalleryImages(images);
  const primaryIndex = Math.max(
    gallery.findIndex((img) => img.isPrimary),
    0
  );
  const [activeIndex, setActiveIndex] = useState(primaryIndex);

  const activeImage = gallery[activeIndex];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <ProductImage src={activeImage?.url} alt={productName} priority />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {gallery.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${productName} - ${index + 1}. fotoğrafı gör`}
              aria-current={index === activeIndex}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              )}
            >
              <ProductImage src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
