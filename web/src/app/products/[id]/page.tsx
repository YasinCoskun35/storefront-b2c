import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { catalogApi, settingsApi } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/products/add-to-cart-section";
import { ProductInquiry } from "@/components/products/product-inquiry";
import { ProductGallery } from "@/components/products/product-gallery";
import { StockBadge } from "@/components/products/stock-badge";
import { ENABLE_ORDERING } from "@/lib/config";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await catalogApi.getProductById(id);
    const image = getImageUrl(product.primaryImageUrl);

    return {
      title: `${product.name} - Storefront`,
      description:
        product.shortDescription || product.description || product.name,
      openGraph: {
        title: product.name,
        description:
          product.shortDescription || product.description || product.name,
        images: image ? [image] : [],
      },
    };
  } catch (error) {
    return {
      title: "Product Not Found - Storefront",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  let product;
  try {
    product = await catalogApi.getProductById(id);
  } catch (error) {
    notFound();
  }

  // Store settings power the "ask on WhatsApp" CTA when ordering is disabled.
  const whatsAppNumber = ENABLE_ORDERING
    ? undefined
    : await settingsApi
        .get()
        .then((s) => s.whatsAppNumber)
        .catch(() => undefined);

  const specs = [
    product.weight && { label: "Weight", value: `${product.weight} ${product.weightUnit || "kg"}` },
    product.length && { label: "Length", value: `${product.length} ${product.dimensionUnit || "cm"}` },
    product.width && { label: "Width", value: `${product.width} ${product.dimensionUnit || "cm"}` },
    product.height && { label: "Height", value: `${product.height} ${product.dimensionUnit || "cm"}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary">
          Products
        </Link>
        {product.categoryName && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/products?categoryId=${product.categoryId}`}
              className="hover:text-primary"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <p className="mb-1 text-sm font-medium text-primary">
              {product.brandName || "Hardware"}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {product.price != null && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <StockBadge status={product.stockStatus} />
              {product.stockStatus === "InStock" && product.quantity > 0 && (
                <span className="text-sm text-muted-foreground">
                  {product.quantity} available
                </span>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            {ENABLE_ORDERING ? (
              <AddToCartSection product={product} />
            ) : (
              <ProductInquiry
                productName={product.name}
                stockStatus={product.stockStatus}
                whatsAppNumber={whatsAppNumber}
              />
            )}
          </div>

          {product.shortDescription && (
            <div className="border-t pt-6">
              <h2 className="mb-2 font-display text-lg font-semibold">Overview</h2>
              <p className="text-muted-foreground">{product.shortDescription}</p>
            </div>
          )}

          {product.description && (
            <div className="border-t pt-6">
              <h2 className="mb-2 font-display text-lg font-semibold">Description</h2>
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {specs.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="mb-3 font-display text-lg font-semibold">Specifications</h2>
              <dl className="divide-y rounded-lg border">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between px-4 py-2.5 text-sm">
                    <dt className="font-medium text-foreground">{spec.label}</dt>
                    <dd className="text-muted-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
