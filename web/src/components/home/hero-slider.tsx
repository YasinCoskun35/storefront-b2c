"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";
import type { SliderSlide } from "@/lib/api";

interface HeroSliderProps {
  slides: SliderSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance every 6s (pauses via key reset when the user navigates).
  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <section className="relative overflow-hidden border-b bg-secondary text-secondary-foreground">
      <div className="relative aspect-[21/9] max-h-[520px] w-full sm:aspect-[3/1]">
        {slides.map((slide, i) => {
          const src = getImageUrl(slide.imageUrl);
          const active = i === index;
          return (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={!active}
            >
              {src && (
                <Image
                  src={src}
                  alt={slide.headline || `Slide ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
              {(slide.headline || slide.subtext || slide.ctaLabel) && (
                <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 via-black/30 to-transparent">
                  <div className="container mx-auto px-4">
                    <div className="max-w-xl text-white">
                      {slide.headline && (
                        <h1 className="font-display text-3xl font-bold tracking-tight text-balance drop-shadow md:text-5xl">
                          {slide.headline}
                        </h1>
                      )}
                      {slide.subtext && (
                        <p className="mt-4 max-w-md text-base text-white/90 drop-shadow md:text-lg">
                          {slide.subtext}
                        </p>
                      )}
                      {slide.ctaLabel && slide.ctaLink && (
                        <Link href={slide.ctaLink} className="mt-6 inline-block">
                          <Button size="lg">{slide.ctaLabel}</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
