import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { HeroSlider } from "@/components/home/hero-slider";
import { catalogApi, settingsApi } from "@/lib/api";

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Hızlı Teslimat",
    description: "Kapınıza veya şantiyenize güvenilir teslimat.",
  },
  {
    icon: ShieldCheck,
    title: "Güvenli Ödeme",
    description: "Ödemeler iyzico ile güvenli şekilde işlenir.",
  },
  {
    icon: Wrench,
    title: "Profesyonel Kalite",
    description: "Dayanıklı ve güvenilir ürünlerden oluşan seçkin bir katalog.",
  },
  {
    icon: Package,
    title: "Her Zaman Stokta",
    description: "Anlık stok takibiyle nelerin mevcut olduğunu görün.",
  },
];

export default async function HomePage() {
  const [categoriesResult, productsResult, settingsResult] = await Promise.allSettled([
    catalogApi.getCategories(),
    catalogApi.searchProducts({ isActive: true, pageSize: 8 }),
    settingsApi.get(),
  ]);

  const slides =
    settingsResult.status === "fulfilled" ? settingsResult.value.slides ?? [] : [];

  const categories =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value
          .filter((c) => c.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .slice(0, 6)
      : [];

  const featuredProducts =
    productsResult.status === "fulfilled"
      ? [...productsResult.value.items]
          .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
          .slice(0, 8)
      : [];

  return (
    <div>
      {/* Admin-managed slider takes over the hero when slides are configured */}
      {slides.length > 0 && <HeroSlider slides={slides} />}

      {/* Default hero (shown when no slider slides are configured) */}
      {slides.length === 0 && (
      <section className="relative overflow-hidden border-b bg-secondary text-secondary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, hsl(var(--primary)) 0%, transparent 35%), radial-gradient(circle at 85% 80%, hsl(var(--accent)) 0%, transparent 35%)",
          }}
        />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full border border-secondary-foreground/20 bg-secondary-foreground/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-secondary-foreground/70">
              Kaliteli Hırdavat ve Yapı Malzemeleri
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-balance md:text-6xl">
              İşinizi bitirmek için{" "}
              <span className="text-primary">ihtiyacınız olan her şey</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-secondary-foreground/70">
              Ustalar ve kendin-yap meraklıları için profesyonel kalitede
              ürünler; hızlı teslimat ve güvenli ödeme.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Ürünleri İncele
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground sm:w-auto"
                >
                  Daha Fazla Bilgi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Value props */}
      <section className="border-b bg-muted/40">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-semibold">{title}</h3>
              <p className="hidden text-sm text-muted-foreground md:block">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Kategoriye Göre Alışveriş</h2>
              <p className="mt-1 text-muted-foreground">
                Projeniz için tam ihtiyacınız olanı bulun.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              Tüm ürünleri gör
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.productCount} ürün
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold">Öne Çıkan Ürünler</h2>
                <p className="mt-1 text-muted-foreground">
                  Katalogumuzdan popüler seçimler.
                </p>
              </div>
              <Link
                href="/products"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                Tüm ürünleri gör
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
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
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Bir sonraki projenize başlamaya hazır mısınız?
            </h2>
            <p className="mt-2 text-primary-foreground/90">
              Tüm katalogu inceleyin, dakikalar içinde alışverişinizi tamamlayın.
            </p>
          </div>
          <Link href="/products">
            <Button
              size="lg"
              variant="secondary"
              className="whitespace-nowrap bg-white text-primary hover:bg-white/90"
            >
              Alışverişe Başla
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
