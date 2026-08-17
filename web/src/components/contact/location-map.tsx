interface LocationMapProps {
  address: string;
  /**
   * Overrides what's searched for the pin — pass the exact place name plus
   * "lat,lng" (from the business's Google Maps listing) so the embed points
   * at the actual storefront instead of an address-text guess.
   */
  query?: string;
  className?: string;
}

/**
 * Google Maps embed for the store address. Uses the no-API-key embed URL
 * (maps?...&output=embed) — nothing to configure, works immediately.
 * The aspect-ratio wrapper keeps it fluid on any screen size.
 */
export function LocationMap({ address, query, className }: LocationMapProps) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query || address)}&output=embed`;

  return (
    <div className={`overflow-hidden rounded-xl border bg-muted ${className ?? ""}`}>
      <div className="relative aspect-[4/3] w-full sm:aspect-video">
        <iframe
          src={src}
          title="Mağaza konumu"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
