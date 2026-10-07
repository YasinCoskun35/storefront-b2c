import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StockBadge, type StockStatus } from "@/components/products/stock-badge";
import { ProductImage } from "@/components/products/product-image";
import { formatPrice } from "@/lib/utils";
import { SHOW_PRICES } from "@/lib/config";

interface ProductCardProps {
  id: string;
  name: string;
  price: number | null | undefined;
  compareAtPrice?: number | null;
  image?: string;
  stockStatus: StockStatus;
  category?: string;
}

export function ProductCard({
  id,
  name,
  price,
  compareAtPrice,
  image,
  stockStatus,
  category,
}: ProductCardProps) {
  const hasDiscount = price != null && compareAtPrice != null && compareAtPrice > price;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image */}
      <Link href={`/products/${id}`} className="relative block" tabIndex={-1}>
        <div className="relative aspect-square overflow-hidden bg-white">
          {/* contain, not cover: supplier photos are often wide (handles, rails) and cropping cuts the product off */}
          <ProductImage
            src={image}
            alt={name}
            fit="contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="p-2 transition-transform duration-300 group-hover:scale-105 sm:p-4"
          />

          <div className="absolute right-2 top-2 hidden sm:block">
            <StockBadge status={stockStatus} />
          </div>

          {category && (
            <div className="absolute left-2 right-2 top-2 sm:right-24">
              <Badge className="max-w-full truncate border-transparent bg-blue-600 px-2 py-0.5 text-[10px] text-white shadow-sm hover:bg-blue-600 sm:text-xs">
                {category}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <CardContent className="flex-1 p-3 sm:p-4">
        <Link href={`/products/${id}`}>
          <h3 className="font-display text-sm font-semibold leading-snug sm:text-base text-foreground line-clamp-2 transition-colors hover:text-primary">
            {name}
          </h3>
        </Link>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col items-start gap-1 p-3 pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:p-4 sm:pt-0">
        <div className="flex flex-col">
          {SHOW_PRICES && price != null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(compareAtPrice!)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground sm:text-sm">Fiyat için sorunuz</span>
          )}
        </div>

        <Link
          href={`/products/${id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Detayları gör
        </Link>
      </CardFooter>
    </Card>
  );
}
