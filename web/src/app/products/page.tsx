import { Suspense } from "react";
import { catalogApi } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    pageNumber?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const pageNumber = parseInt(params.pageNumber || "1");
  const pageSize = 12;

  // Fetch products and categories in parallel
  const [productsResult, categories] = await Promise.all([
    catalogApi.searchProducts({
      searchTerm: params.q,
      categoryId: params.categoryId,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      pageNumber,
      pageSize,
    }),
    catalogApi.getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.id === params.categoryId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">
          {activeCategory ? activeCategory.name : "Ürünler"}
        </h1>
        {params.q ? (
          <p className="mt-2 text-muted-foreground">
            &ldquo;{params.q}&rdquo; için sonuçlar
          </p>
        ) : activeCategory?.description ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{activeCategory.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20">
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <ProductFilters
                categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              />
            </Suspense>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {productsResult.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-lg font-medium">Ürün bulunamadı</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Aramanızı veya filtreleri değiştirin ya da tüm ürünlere göz atın.
              </p>
              <Link href="/products">
                <Button variant="outline" className="mt-2">
                  Filtreleri temizle
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {productsResult.totalCount} üründen {(pageNumber - 1) * pageSize + 1}-
                  {Math.min(pageNumber * pageSize, productsResult.totalCount)} arası gösteriliyor
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {productsResult.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={product.primaryImageUrl}
                    stockStatus={product.stockStatus}
                    category={product.categoryName}
                  />
                ))}
              </div>

              {/* Pagination */}
              {productsResult.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {productsResult.hasPreviousPage ? (
                    <Link
                      href={`/products?${new URLSearchParams({
                        ...params,
                        pageNumber: (pageNumber - 1).toString(),
                      })}`}
                    >
                      <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="icon" disabled>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}

                  <span className="px-2 text-sm font-medium">
                    Sayfa {pageNumber} / {productsResult.totalPages}
                  </span>

                  {productsResult.hasNextPage ? (
                    <Link
                      href={`/products?${new URLSearchParams({
                        ...params,
                        pageNumber: (pageNumber + 1).toString(),
                      })}`}
                    >
                      <Button variant="outline" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="icon" disabled>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
