"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { ProductImage } from "@/components/products/product-image";
import { cn, getImageUrl } from "@/lib/utils";
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

// Full-resolution file for the zoom view: the Original variant of the same
// photo (variants of one upload share a displayOrder), falling back to the
// gallery file itself.
function zoomUrl(images: ProductImageDto[], img: ProductImageDto): string | undefined {
  const original = images.find(
    (i) => i.type === "Original" && i.displayOrder === img.displayOrder
  );
  return getImageUrl((original ?? img).url) ?? undefined;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = selectGalleryImages(images);
  const primaryIndex = Math.max(
    gallery.findIndex((img) => img.isPrimary),
    0
  );
  const [activeIndex, setActiveIndex] = useState(primaryIndex);
  const [zoomOpen, setZoomOpen] = useState(false);

  const activeImage = gallery[activeIndex];
  const slides = gallery
    .map((img) => ({ src: zoomUrl(images, img) ?? "", alt: productName }))
    .filter((s) => s.src);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => activeImage && setZoomOpen(true)}
        disabled={!activeImage}
        aria-label={`${productName} fotoğrafını büyüt`}
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted"
      >
        {activeImage?.url && (
          <div
            aria-hidden
            className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
            style={{ backgroundImage: `url(${getImageUrl(activeImage.url)})` }}
          />
        )}
        <ProductImage src={activeImage?.url} alt={productName} priority fit="contain" />
        {activeImage && (
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <ZoomIn className="h-4 w-4" />
            Büyüt
          </span>
        )}
      </button>

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
                "relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition-colors",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              )}
            >
              <ProductImage src={img.url} alt="" fit="contain" className="p-1" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={zoomOpen}
        close={() => setZoomOpen(false)}
        index={activeIndex}
        slides={slides}
        plugins={[Zoom, Counter]}
        on={{ view: ({ index }) => setActiveIndex(index) }}
        // Never zoom past the photo's real resolution - beyond that it only gets blurrier.
        zoom={{ maxZoomPixelRatio: 1, scrollToZoom: true, doubleTapDelay: 300 }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        carousel={{ finite: slides.length <= 1 }}
        render={slides.length <= 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
        styles={{ container: { backgroundColor: "#fff" } }}
        className="product-zoom"
      />
    </div>
  );
}
