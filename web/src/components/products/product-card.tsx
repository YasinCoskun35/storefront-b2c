import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StockBadge, type StockStatus } from "@/components/products/stock-badge";
import { ProductImage } from "@/components/products/product-image";
import { formatPrice } from "@/lib/utils";

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
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ProductImage
            src={image}
            alt={name}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="transition-transform duration-300 group-hover:scale-105"
          />

          <div className="absolute right-2 top-2">
            <StockBadge status={stockStatus} />
          </div>

          {category && (
            <div className="absolute left-2 top-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {category}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <CardContent className="flex-1 p-4">
        <Link href={`/products/${id}`}>
          <h3 className="font-display text-base font-semibold leading-snug text-foreground line-clamp-2 transition-colors hover:text-primary">
            {name}
          </h3>
        </Link>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex items-center justify-between gap-2 p-4 pt-0">
        <div className="flex flex-col">
          {price != null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(compareAtPrice!)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Fiyat için sorunuz</span>
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
