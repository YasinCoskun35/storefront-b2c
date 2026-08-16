import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
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
      title: `${product.name} - Harun Yapı Market`,
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
      title: "Ürün Bulunamadı - Harun Yapı Market",
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
    product.weight && { label: "Ağırlık", value: `${product.weight} ${product.weightUnit || "kg"}` },
    product.length && { label: "Uzunluk", value: `${product.length} ${product.dimensionUnit || "cm"}` },
    product.width && { label: "Genişlik", value: `${product.width} ${product.dimensionUnit || "cm"}` },
    product.height && { label: "Yükseklik", value: `${product.height} ${product.dimensionUnit || "cm"}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Ana Sayfa
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary">
          Ürünler
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
              {product.brandName || "Hırdavat"}
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
                  {product.quantity} adet mevcut
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
              <h2 className="mb-2 font-display text-lg font-semibold">Genel Bakış</h2>
              <p className="text-muted-foreground">{product.shortDescription}</p>
            </div>
          )}

          {product.description && (
            <div className="border-t pt-6">
              <h2 className="mb-2 font-display text-lg font-semibold">Açıklama</h2>
              <div
                className="max-w-none text-sm leading-relaxed text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
              />
            </div>
          )}

          {specs.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="mb-3 font-display text-lg font-semibold">Teknik Özellikler</h2>
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
